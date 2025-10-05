"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import styles from "./battle-button.module.css";

export type BattleButtonProps = React.ComponentPropsWithoutRef<"button"> & {
	/** Optional content override. Defaults to "Battle". */
	label?: React.ReactNode;
};

/**
 * Renders a glossy arcade-style call-to-action matching the reference artwork.
 */
const BattleButton = React.forwardRef<HTMLButtonElement, BattleButtonProps>(
	(
		{ className, label = "Battle", children, type = "button", ...props },
		ref,
	) => {
		const content = children ?? label;

		return (
			<button
				type={type}
				ref={ref}
				className={cn(styles.root, className)}
				{...props}
			>
				<span className={styles.surface}>
					<span className={styles.label}>{content}</span>
					<span aria-hidden className={styles.bubble} />
				</span>
			</button>
		);
	},
);

BattleButton.displayName = "BattleButton";

export { BattleButton };
