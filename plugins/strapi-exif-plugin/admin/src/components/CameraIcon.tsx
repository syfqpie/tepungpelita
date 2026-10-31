import styled from 'styled-components'

interface CameraIconProps {
	width?: string | number
	height?: string | number
	/** A theme colour key such as `neutral500`, passed by Strapi's menu like it does for its own icons. */
	fill?: string
}

// Strapi colours menu icons through `svg path` rules (hover, active), so the glyph is a single path. This
// only sets the resting colour, from the theme key the menu passes in.
const Svg = styled.svg<{ $fill?: string }>`
	path {
		fill: ${({ theme, $fill }) => ($fill && (theme.colors as unknown as Record<string, string>)[$fill]) || 'currentColor'};
	}
`

/** A camera in Strapi's icon style (32x32, filled). Strapi's icon set has none, and `Images` is the Media Library's icon. */
const CameraIcon = ({ width = 16, height = 16, fill }: CameraIconProps) => (
	<Svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 32 32" aria-hidden focusable="false" $fill={fill}>
		{/* body with the viewfinder bump, a lens-sized hole, and the lens glass inside it */}
		<path
			fillRule="evenodd"
			d="M12.2 5H19.8L21.5 8H27A3 3 0 0 1 30 11V25A3 3 0 0 1 27 28H5A3 3 0 0 1 2 25V11A3 3 0 0 1 5 8H10.5ZM16 11.5a6 6 0 1 0 0 12a6 6 0 1 0 0-12ZM16 14.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6Z"
		/>
	</Svg>
)

export default CameraIcon
