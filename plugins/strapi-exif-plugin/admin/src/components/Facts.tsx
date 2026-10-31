import styled from 'styled-components'

export const Facts = styled.dl`
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
export const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div>
		<dt>{label}</dt>
		<dd>{children}</dd>
	</div>
)
