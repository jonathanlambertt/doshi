import { type Href, router } from "expo-router";

/**
 * Goes to `href` with nothing left behind it, so Back (a swipe on iOS, the
 * back button on Android) can't return to the screens before it. Used when
 * moving between the landing screens and the app, e.g. so Home never has the
 * landing screen underneath.
 */
export function resetTo(href: Href) {
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace(href);
}
