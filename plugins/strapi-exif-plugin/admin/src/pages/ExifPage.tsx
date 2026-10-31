import { useCallback, useEffect, useState } from 'react'
import {
	Button,
	EmptyStateLayout,
	Flex,
	LinkButton,
	Loader,
	Main,
	Table,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	Typography,
} from '@strapi/design-system'
import { EmptyPermissions, EmptyPictures } from '@strapi/icons/symbols'
import { Layouts, useFetchClient } from '@strapi/strapi/admin'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import AboutButton from '../components/AboutButton'
import DetailPanel from '../components/DetailPanel'
import Readout from '../components/Readout'
import type { ExifRow } from '../types'
import { assetUrl, backendUrl, cameraName, formatTaken, saveFile, thumbUrl, toCsv } from '../utils'

const PAGE_SIZE = 20
const EXPORT_PAGE_SIZE = 100

interface Pagination {
	page: number
	pageCount: number
	total: number
}

const rowId = (id: number) => `exif-row-${id}`

const NAME_STYLE = {
	display: 'block',
	maxWidth: '22rem',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
} as const

// `&&` raises specificity above the design system's own row background.
const SelectableRow = styled(Tr)`
	cursor: pointer;

	&& {
		box-shadow: inset 3px 0 0 transparent;
	}

	&&:hover {
		background: ${({ theme }) => theme.colors.neutral100};
	}

	&&[aria-selected='true'] {
		background: ${({ theme }) => theme.colors.primary100};
		box-shadow: inset 3px 0 0 ${({ theme }) => theme.colors.primary600};
	}

	&&:focus-visible {
		outline: 2px solid ${({ theme }) => theme.colors.primary600};
		outline-offset: -2px;
	}
`

// The design system's disabled button keeps the default cursor, which doesn't say "can't click".
const ExportButton = styled(Button)`
	&&[aria-disabled='true'] {
		cursor: not-allowed;
	}
`

const Thumb = styled.img`
	flex: none;
	width: 5.6rem;
	height: 5.6rem;
	object-fit: cover;
	border-radius: ${({ theme }) => theme.borderRadius};
	background: ${({ theme }) => theme.colors.neutral100};
`

const ExifPage = () => {
	const { get } = useFetchClient()
	const [page, setPage] = useState(1)
	const [rows, setRows] = useState<ExifRow[]>([])
	const [pagination, setPagination] = useState<Pagination>({ page: 1, pageCount: 1, total: 0 })
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [denied, setDenied] = useState(false)
	const [selected, setSelected] = useState<ExifRow | null>(null)
	const [exporting, setExporting] = useState(false)
	const [exportError, setExportError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false

		setLoading(true)
		get<{ results: ExifRow[]; pagination: Pagination }>('/exif/images', { params: { page, pageSize: PAGE_SIZE } })
			.then(({ data }) => {
				if (cancelled) return
				setRows(data.results)
				setPagination(data.pagination)
				setSelected(null)
				setError(null)
				setDenied(false)
			})
			.catch((err) => {
				if (cancelled) return

				setDenied(err?.status === 403)
				setError(`Could not load EXIF data: ${err?.message ?? err}`)
			})
			.finally(() => !cancelled && setLoading(false))

		return () => {
			cancelled = true
		}
	}, [get, page])

	// Closing hands focus back to the row that was open, so keyboard users keep their place.
	const close = useCallback(() => {
		setSelected((current) => {
			if (current) requestAnimationFrame(() => document.getElementById(rowId(current.id))?.focus())

			return null
		})
	}, [])

	useEffect(() => {
		if (!selected) return

		const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && close()

		window.addEventListener('keydown', onKeyDown)

		return () => window.removeEventListener('keydown', onKeyDown)
	}, [selected, close])

	const exportCsv = async () => {
		setExporting(true)
		setExportError(null)

		try {
			const all: ExifRow[] = []

			for (let next = 1, pages = 1; next <= pages; next += 1) {
				const { data } = await get<{ results: ExifRow[]; pagination: Pagination }>('/exif/images', {
					params: { page: next, pageSize: EXPORT_PAGE_SIZE },
				})

				all.push(...data.results)
				pages = data.pagination.pageCount
			}

			// The BOM makes Excel read the file as UTF-8.
			saveFile(
				`exif-${new Date().toISOString().slice(0, 10)}.csv`,
				'text/csv;charset=utf-8',
				`\uFEFF${toCsv(all, backendUrl() || window.location.origin)}`,
			)
		} catch (err) {
			setExportError(`Could not export: ${(err as Error)?.message ?? err}`)
		} finally {
			setExporting(false)
		}
	}

	return (
		<Main>
			<Layouts.Header
				title="EXIF"
				subtitle={`${pagination.total} image${pagination.total === 1 ? '' : 's'} with EXIF metadata`}
				secondaryAction={<AboutButton />}
				primaryAction={
					<ExportButton
						variant="secondary"
						loading={exporting}
						disabled={loading || denied || Boolean(error) || pagination.total === 0}
						onClick={exportCsv}
					>
						Export CSV
					</ExportButton>
				}
			/>
			<Layouts.Content>
				{exportError && <Typography textColor="danger600">{exportError}</Typography>}
				{denied ? (
					<EmptyStateLayout
						icon={<EmptyPermissions width="16rem" />}
						content="You don't have permission to see EXIF data. It follows Media Library access, so ask an admin to allow Read on the Media Library."
					/>
				) : error ? (
					<Typography textColor="danger600">{error}</Typography>
				) : loading ? (
					<Loader>Loading EXIF data</Loader>
				) : rows.length === 0 ? (
					<EmptyStateLayout
						icon={<EmptyPictures width="16rem" />}
						content="No photos with EXIF data yet. Upload a JPEG, PNG, TIFF, HEIC or AVIF photo and it shows up here."
						action={
							<LinkButton tag={NavLink} to="/plugins/upload" variant="secondary">
								Go to Media Library
							</LinkButton>
						}
					/>
				) : (
					<Flex alignItems="flex-start" gap={6}>
						<Flex direction="column" alignItems="stretch" gap={4} flex="1" minWidth={0}>
							<Table colCount={5} rowCount={rows.length}>
								<Thead>
									<Tr>
										<Th>Image</Th>
										<Th>Camera</Th>
										<Th>Taken</Th>
										<Th>Exposure</Th>
										<Th>GPS</Th>
									</Tr>
								</Thead>
								<Tbody>
									{rows.map((row) => (
										<ExifTableRow key={row.id} row={row} selected={selected?.id === row.id} onSelect={setSelected} />
									))}
								</Tbody>
							</Table>
							<Flex justifyContent="space-between" alignItems="center">
								<Button variant="tertiary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
									Previous
								</Button>
								<Typography>
									Page {pagination.page} of {pagination.pageCount}
								</Typography>
								<Button variant="tertiary" disabled={page >= pagination.pageCount} onClick={() => setPage(page + 1)}>
									Next
								</Button>
							</Flex>
						</Flex>
						{selected && <DetailPanel row={selected} onClose={close} />}
					</Flex>
				)}
			</Layouts.Content>
		</Main>
	)
}

interface ExifTableRowProps {
	row: ExifRow
	selected: boolean
	onSelect: (row: ExifRow) => void
}

const ExifTableRow = ({ row, selected, onSelect }: ExifTableRowProps) => {
	const thumb = row.file ? thumbUrl(row.file) : null
	const name = row.file?.name ?? '(file removed)'

	return (
		<SelectableRow
			id={rowId(row.id)}
			tabIndex={0}
			aria-selected={selected}
			onClick={() => onSelect(row)}
			onKeyDown={(event: React.KeyboardEvent) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault()
					onSelect(row)
				}
			}}
		>
			<Td>
				<Flex gap={3} alignItems="center">
					{thumb && <Thumb src={assetUrl(thumb, backendUrl())} alt="" />}
					{/* One line with an ellipsis: table cells don't wrap, so a long name would otherwise push the other columns away. */}
					<Typography fontWeight="semiBold" title={name} style={NAME_STYLE}>
						{name}
					</Typography>
				</Flex>
			</Td>
			<Td>
				<Typography>{cameraName(row.cameraMake, row.cameraModel) || '–'}</Typography>
			</Td>
			<Td>
				<Typography>{formatTaken(row.dateTaken, { time: false }) || '–'}</Typography>
			</Td>
			<Td>
				<Readout row={row} />
			</Td>
			<Td>
				<Typography textColor={row.gpsLatitude != null ? 'neutral800' : 'neutral500'}>
					{row.gpsLatitude != null ? 'Yes' : '–'}
				</Typography>
			</Td>
		</SelectableRow>
	)
}

export default ExifPage
