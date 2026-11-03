import '@fontsource-variable/inter/wght.css'
import './styles.css'
import { render } from 'preact'
import { startClock } from './app/clock.ts'
import { startFullscreen } from './app/fullscreen.ts'
import { startRouter } from './app/router.ts'
import { App } from './components/App.tsx'
import { locale } from './i18n/index.ts'

const root = document.getElementById('app')
if (!root) throw new Error('index.html has no #app element')

document.documentElement.lang = locale
startRouter()
startClock()
startFullscreen()
render(<App />, root)
