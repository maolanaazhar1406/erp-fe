import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="card error-box">
                <h3>Halaman ini gagal ditampilkan</h3>
                <p className="muted">Terjadi error saat merender halaman. Detailnya ada di bawah.</p>
                <pre>{String(this.state.error?.stack || this.state.error)}</pre>
                <div className="row">
                    <button className="ghost" onClick={() => this.setState({ error: null })}>Coba lagi</button>
                    <button onClick={() => window.location.reload()}>Muat ulang</button>
                </div>
            </div>
        );
    }
}