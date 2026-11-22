// DEV-only: mascot + icon gallery (open /#gallery while running `npm run dev`).
import YukiArt from '../components/YukiArt.jsx'
import Icon from '../components/Icon.jsx'

const MOODS = ['idle', 'happy', 'love', 'sad', 'hot', 'hungry', 'sleep', 'wow']
const PROPS = ['dill', 'party', 'crown', 'tunnel', 'sparkle', 'drops', 'scale']
const ICONS = ['home','food','scale','broom','drop','gear','plus','minus','x','check','right','down','left','calendar','search','star','refresh','print','vet','logout','user','crown','lock','trash','spark','heart','alert','moon','pill','clock','eye']

export default function Gallery() {
  return (
    <div style={{ padding: 24, background: '#F4EEE1', minHeight: '100vh', color: '#141B3D' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        {MOODS.map((m) => (
          <div key={m} style={{ textAlign: 'center' }}>
            <YukiArt mood={m} size={150} />
            <div>{m}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 40 }}>
        {PROPS.map((p) => (
          <div key={p} style={{ textAlign: 'center', paddingTop: 20 }}>
            <YukiArt mood="happy" prop={p} size={150} />
            <div>{p}</div>
          </div>
        ))}
        <div style={{ background: '#2549D8', padding: 20, borderRadius: 24 }}><YukiArt mood="idle" size={60} /></div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 30 }}>
        {ICONS.map((n) => (
          <div key={n} style={{ textAlign: 'center', fontSize: 10 }}><Icon name={n} size={28} />{n}</div>
        ))}
      </div>
    </div>
  )
}
