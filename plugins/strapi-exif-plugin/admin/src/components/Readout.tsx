import styled from 'styled-components'

import type { ExifRow } from '../types'
import { formatAperture, formatFocalLength, formatShutter } from '../utils'

const Large = styled.dl`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: ${({ theme }) => theme.spaces[4]} ${({ theme }) => theme.spaces[6]};
	margin: 0;
	font-variant-numeric: tabular-nums;

	div {
		min-width: 0;
	}

	dt {
		font-size: 1.4rem;
		color: ${({ theme }) => theme.colors.neutral600};
	}

	dd {
		margin: 0;
		font-size: 2.4rem;
		font-weight: 600;
		line-height: 1.2;
		white-space: nowrap;
		color: ${({ theme }) => theme.colors.neutral800};
	}
`

const Compact = styled.span`
	display: inline-flex;
	flex-wrap: wrap;
	gap: ${({ theme }) => theme.spaces[1]} ${({ theme }) => theme.spaces[4]};
	font-variant-numeric: tabular-nums;
`

const values = (row: ExifRow) => ({
	iso: row.iso != null ? String(row.iso) : '',
	aperture: formatAperture(row.aperture),
	shutter: formatShutter(row.exposureTime),
	focalLength: formatFocalLength(row.focalLength),
})

/** The four settings a photographer reads first: large in the detail panel, one line in list rows. */
const Readout = ({ row, large = false }: { row: ExifRow; large?: boolean }) => {
	const v = values(row)

	if (!large) {
		const parts = [v.iso && `ISO ${v.iso}`, v.aperture, v.shutter, v.focalLength].filter(Boolean)

		return <Compact>{parts.length > 0 ? parts.map((part) => <span key={part}>{part}</span>) : '–'}</Compact>
	}

	const cells: [string, string][] = [
		['ISO', v.iso],
		['Aperture', v.aperture],
		['Shutter', v.shutter],
		['Focal length', v.focalLength],
	]

	return (
		<Large>
			{cells.map(([label, value]) => (
				<div key={label}>
					<dt>{label}</dt>
					<dd>{value || '–'}</dd>
				</div>
			))}
		</Large>
	)
}

export default Readout
