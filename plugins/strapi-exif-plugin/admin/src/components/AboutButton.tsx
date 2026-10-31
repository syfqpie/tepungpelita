import { Flex, IconButton, Link, Popover, Typography } from '@strapi/design-system'
import { Information } from '@strapi/icons'

import about from '../about'
import { Fact, Facts } from './Facts'

/** An info button that opens a small "about this plugin" popover: version, creator and repository. */
const AboutButton = () => (
	<Popover.Root>
		<Popover.Trigger>
			<IconButton label="About this plugin" variant="tertiary">
				<Information />
			</IconButton>
		</Popover.Trigger>
		<Popover.Content side="bottom" align="end" sideOffset={8}>
			<Flex direction="column" alignItems="stretch" gap={3} padding={5} style={{ width: '32rem', maxWidth: '90vw' }}>
				<div>
					<Typography variant="delta" tag="h2">
						{about.title}
					</Typography>
					{about.description && <Typography textColor="neutral600">{about.description}</Typography>}
				</div>
				<Facts>
					<Fact label="Version">{about.version}</Fact>
					{about.author && <Fact label="Created by">{about.author}</Fact>}
					{about.repoHref && (
						<Fact label="Repository">
							<Link href={about.repoHref} isExternal>
								{about.repoLabel || 'View source'}
							</Link>
						</Fact>
					)}
				</Facts>
			</Flex>
		</Popover.Content>
	</Popover.Root>
)

export default AboutButton
