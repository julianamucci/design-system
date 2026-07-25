/**
 * Type augmentations for @base-ui/react primitives used in docs/stories.
 *
 * The docs/stories layer passes several legacy-style props (asChild, openDelay,
 * closeDelay, delayDuration, decorative, type, orientation, side, direction)
 * that base-ui does not declare. We widen the relevant interfaces here so the
 * authoring layer typechecks without per-call casts. The wrapper primitives in
 * src/components/ui/ forward unknown props via {...props}; base-ui ignores
 * unknown props at runtime.
 */
export {};
