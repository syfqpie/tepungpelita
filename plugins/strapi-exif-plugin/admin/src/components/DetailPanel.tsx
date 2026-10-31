import { useEffect, useRef, useState } from 'react'
import { Box, Button, Divider, Flex, IconButton, Link, Searchbar, Typography } from '@strapi/design-system'
import { Cross } from '@strapi/icons'
import { NavLink } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

import type { ExifRow } from '../types'
import {
	assetUrl,
	backendUrl,
	cameraName,
	formatSize,
	formatTaken,
	jsonFileName,
	mapUrl,
	previewUrl,
	saveFile,
	tagEntries,
} from '../utils'
import { Fact, Facts } from './Facts'
import Readout from './Readout'

const slideIn = keyframes`
	from { transform: translateX(1.6rem); opacity: 0; }
	to { transform: none; opacity: 1; }
`

const Aside = styled.aside`
	flex: 0 0 40rem;
	position: sticky;
	top: 0;
	max-height: 100vh;
	overflow-y: auto;
	background: ${({ theme }) => theme.colors.neutral0};
	border: 1px solid ${({ theme }) => theme.colors.neutral150};
	border-radius: ${({ theme }) => theme.borderRadius};
	animation: ${slideIn} 160ms ease-out;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	/* Not enough room beside the list: cover it instead. */
	@media (max-width: 1100px) {
		position: fixed;
		inset: 0;
		z-index: 4;
		max-height: none;
		border: 0;
		border-radius: 0;
	}
`

const Photo = styled.img`
	display: block;
	width: 100%;
	max-height: 28rem;
	object-fit: contain;
	background: ${({ theme }) => theme.colors.neutral100};
	border-radius: ${({ theme }) => theme.borderRadius};
`

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<Flex direction="column" alignItems="stretch" gap={3}>
		<Typography variant="delta" tag="h3">
			{title}
		</Typography>
		{children}
	</Flex>
)

const DetailPanel = ({ row, onClose }: { row: ExifRow; onClose: () => void }) => {
	const closeRef = useRef<HTMLButtonElement>(null)
	const [query, setQuery] = useState('')
	const { file } = row

	useEffect(() => {
		closeRef.current?.focus()
		setQuery('')
	}, [row.id])

	const tags = tagEntries(row.raw)
	const needle = query.trim().toLowerCase()
	const shown = needle
		? tags.filter(([name, value]) => name.toLowerCase().includes(needle) || value.toLowerCase().includes(needle))
		: tags
	const hasLocation = row.gpsLatitude != null && row.gpsLongitude != null
	const size = [file?.width && file?.height ? `${file.width} × ${file.height}` : '', formatSize(file?.size), file?.mime ?? '']

	return (
		<Aside aria-label={`EXIF details for ${file?.name ?? 'image'}`}>
			<Flex direction="column" alignItems="stretch" gap={6} padding={5}>
				<Flex justifyContent="space-between" alignItems="flex-start" gap={3}>
					<Box minWidth={0}>
						<Typography variant="beta" tag="h2" style={{ overflowWrap: 'anywhere' }}>
							{file?.name ?? '(file removed)'}
						</Typography>
						<Flex gap={3} wrap="wrap">
							{size.filter(Boolean).map((part) => (
								<Typography key={part} textColor="neutral600">
									{part}
								</Typography>
							))}
						</Flex>
					</Box>
					<IconButton ref={closeRef} label="Close details" variant="tertiary" onClick={onClose}>
						<Cross />
					</IconButton>
				</Flex>

				{file && <Photo src={assetUrl(previewUrl(file), backendUrl())} alt={file.name} />}

				<Flex direction="column" alignItems="flex-start" gap={4}>
					<Flex gap={5} wrap="wrap">
						{file && (
							<Link href={assetUrl(file.url, backendUrl())} isExternal>
								Open image
							</Link>
						)}
						{file && (
							<Link tag={NavLink} to={`/plugins/upload?assetId=${file.id}`}>
								Open in Media Library
							</Link>
						)}
					</Flex>
					<Button
						variant="tertiary"
						size="S"
						onClick={() => saveFile(jsonFileName(file?.name), 'application/json', JSON.stringify(row, null, 2))}
					>
						Download JSON
					</Button>
				</Flex>

				<Readout row={row} large />

				<Divider />

				<Section title="Camera">
					<Facts>
						<Fact label="Body">{cameraName(row.cameraMake, row.cameraModel) || '–'}</Fact>
						<Fact label="Lens">{row.lensModel ?? '–'}</Fact>
						<Fact label="Taken">{formatTaken(row.dateTaken) || '–'}</Fact>
					</Facts>
				</Section>

				<Section title="Location">
					{hasLocation ? (
						<Facts>
							<Fact label="Coordinates">
								{row.gpsLatitude?.toFixed(5)}, {row.gpsLongitude?.toFixed(5)}
							</Fact>
							{row.gpsAltitude != null && <Fact label="Altitude">{Math.round(row.gpsAltitude)} m</Fact>}
							<Fact label="Map">
								<Link href={mapUrl(row.gpsLatitude as number, row.gpsLongitude as number)} isExternal>
									Open in OpenStreetMap
								</Link>
							</Fact>
						</Facts>
					) : (
						<Typography textColor="neutral600">This photo has no GPS data.</Typography>
					)}
				</Section>

				<Divider />

				<Section title={`All tags (${tags.length})`}>
					<Searchbar
						name="exif-tag-filter"
						value={query}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
						onClear={() => setQuery('')}
						clearLabel="Clear filter"
						placeholder="Filter by tag or value"
					>
						Filter tags
					</Searchbar>
					{shown.length === 0 ? (
						<Typography textColor="neutral600">{tags.length === 0 ? 'No tags stored.' : 'No tags match.'}</Typography>
					) : (
						<Facts>
							{shown.map(([name, value]) => (
								<Fact key={name} label={name}>
									{value || '–'}
								</Fact>
							))}
						</Facts>
					)}
				</Section>
			</Flex>
		</Aside>
	)
}

export default DetailPanel
