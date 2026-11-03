import { canFullscreen, fullscreen, toggleFullscreen } from '../app/fullscreen.ts'
import { helpOpen } from '../app/keys.ts'
import { settings } from '../app/settings.ts'
import { messages } from '../i18n/index.ts'
import { CollapseIcon, ExpandIcon, HelpIcon } from './icons.tsx'
import { Logo } from './Logo.tsx'
import { Search } from './Search.tsx'
import { ThemeMenu } from './ThemeMenu.tsx'

export function Header() {
  return (
    <header class="top">
      <Logo />
      <Search />
      <div class="tools">
        <button
          type="button"
          class="toggle"
          aria-pressed={settings.value.hourCycle === 'h23'}
          title={messages.hour24}
          onClick={() => {
            settings.value = {
              ...settings.value,
              hourCycle: settings.value.hourCycle === 'h23' ? 'h12' : 'h23',
            }
          }}
        >
          {messages.hour24Short}
        </button>
        <button
          type="button"
          class="toggle"
          aria-pressed={settings.value.seconds}
          onClick={() => {
            settings.value = { ...settings.value, seconds: !settings.value.seconds }
          }}
        >
          {messages.seconds}
        </button>
        <button
          type="button"
          class="icon-button"
          aria-label={messages.help}
          title={messages.help}
          onClick={() => {
            helpOpen.value = true
          }}
        >
          <HelpIcon />
        </button>
        <ThemeMenu />
        {canFullscreen && (
          <button
            type="button"
            class="icon-button"
            aria-label={fullscreen.value ? messages.exitFullscreen : messages.fullscreen}
            title={fullscreen.value ? messages.exitFullscreen : messages.fullscreen}
            onClick={toggleFullscreen}
          >
            {fullscreen.value ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        )}
      </div>
    </header>
  )
}
