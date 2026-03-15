/**
 * Scroll to a widget on the dashboard by its data-widget-id attribute.
 * Returns true if the widget was found and scrolled to.
 */
export function scrollToWidget(widgetId: string): boolean {
  const element = document.querySelector(`[data-widget-id="${widgetId}"]`)
  if (!element) return false

  const headerOffset = 70
  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset
  window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  return true
}
