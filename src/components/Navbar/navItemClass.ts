/**
 * A row in the navigation: a dropdown's button, or the box around a single link.
 * Focus is shown as an outline in the bar's ink, as the menu button's is. A box
 * around a link cannot take focus itself, so it draws the outline when the link
 * inside it has focus, and the link draws none of its own.
 */
export const navItemClass =
  'inline-flex items-center justify-center h-10 gap-2 px-5 font-bold tracking-wide text-bar-ink transition duration-300 rounded whitespace-nowrap hover:bg-white/10 outline-bar-ink -outline-offset-2 focus-visible:outline-2 focus-visible:bg-white/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:bg-white/15 [&_a]:outline-none'
