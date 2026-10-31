import { useEffect, useRef, useState } from 'react'
import { Box, Divider, Flex, IconButton, Link, Searchbar, Typography } from '@strapi/design-system'
import { Cross } from '@strapi/icons'
import styled, { keyframes } from 'styled-components'

import type { ExifRow } from '../types'
import { assetUrl, formatSize, formatTaken, mapUrl, previewUrl, tagEntries } from '../utils'
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

const Facts = styled.dl`
	margin: 0;

	> div {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: ${({ theme }) => theme.spaces[4]};
		padding: ${({ theme }) => theme.spaces[2]} 0;
		font-size: 1.6rem;
		border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
	}

	> div:last-child {
		border-bottom: 0;
	}

	dt {
		flex: 0 1 auto;
		max-width: 55%;
		overflow-wrap: anywhere;
		color: ${({ theme }) => theme.colors.neutral600};
	}

	dd {
		flex: 1 1 0;
		min-width: 0;
		margin: 0;
		overflow-wrap: anywhere;
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.colors.neutral800};
	}
`

/** One key/value row: the key reads on the left, the value on the right. */
const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div>
		<dt>{label}</dt>
		<dd>{children}</dd>
	</div>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<Flex direction="column" alignItems="stretch" gap={3}>
		<Typography variant="delta" tag="h3">
			{title}
		</Typography>
		{children}
	</Flex>
)

const backendUrl = () => (window as unknown as { strapi?: { backendURL?: string } }).strapi?.backendURL ?? ''

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

				<Readout row={row} large />

				<Divider />

				<Section title="Camera">
					<Facts>
						<Fact label="Body">{[row.cameraMake, row.cameraModel].filter(Boolean).join(' ') || '–'}</Fact>
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
