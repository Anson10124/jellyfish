import * as React from "react"

function checkIsIOS(): boolean {
  if (typeof window === "undefined" || !window.navigator) {
    return false
  }
  const { userAgent, platform, maxTouchPoints } = window.navigator
  const isStandardIOS = /iPhone|iPod|iPad/.test(userAgent)
  const isiPadOS = platform === "MacIntel" && maxTouchPoints > 1
  return isStandardIOS || isiPadOS
}

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return checkIsIOS()
}

function getServerSnapshot() {
  return false
}

export function useIsIOS() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}