import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="card">
      <h1>Strani ni mogoče najti</h1>
      <p>
        <Link to="/">Nazaj na začetno stran</Link>
      </p>
    </div>
  )
}
