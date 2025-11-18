import { useEffect, useRef, useState } from 'react'
import '../styles/UsageGuideSection.css'

const UsageGuideSection = () => {
    const containerRef = useRef(null)
    const [ratio, setRatio] = useState(0.5)
    const [dragging, setDragging] = useState(false)

    const updateRatioFromClientX = (clientX) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        let pos = clientX - rect.left
        pos = Math.max(0, Math.min(rect.width, pos))
        setRatio(pos / rect.width)
    }

    useEffect(() => {
        const handlePointerMove = (event) => {
            if (!dragging) return
            event.preventDefault()
            updateRatioFromClientX(event.clientX)
        }

        const handlePointerUp = () => {
            if (!dragging) return
            setDragging(false)
        }

        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
    }, [dragging])

    const handlePointerDown = (event) => {
        event.preventDefault()
        setDragging(true)
        updateRatioFromClientX(event.clientX)
    }

    const handleContainerClick = (event) => {
        if (dragging) return
        updateRatioFromClientX(event.clientX)
    }

    return (
        <section className="usage-guide-section">
            <div className="usage-guide-container">
                <div className="usage-guide-label">간편한 드레스 매칭</div>
                <div
                    ref={containerRef}
                    className="usage-guide-slider"
                    onClick={handleContainerClick}
                >
                    <div className="slider-image slider-before slider-image-ex-b">
                        <img className="slider-img-ex-b" src="/Image/ex_B.jpg" alt="드레스 착용 전 예시" />
                    </div>

                    <div className="slider-image slider-after slider-image-ex-a">
                        <div
                            className="slider-after-clip"
                            style={{ '--clip-right': `${(1 - ratio) * 100}%` }}
                        >
                            <img className="slider-img-ex-a" src="/Image/ex_A.png" alt="드레스 착용 후 예시" />
                        </div>
                    </div>

                    <div
                        className="slider-bar"
                        style={{
                            left: `${ratio * 100}%`
                        }}
                    />
                    <div
                        className="slider-handle"
                        style={{
                            left: `${ratio * 100}%`,
                            transform: `translate(-50%, -50%)`
                        }}
                        onPointerDown={handlePointerDown}
                        role="presentation"
                    >
                        <div className="slider-knob">⇄</div>
                    </div>
                </div>
                <p className="usage-guide-hint">
                    핸들을 드래그해 전, 후 이미지를 비교해 보세요.
                </p>
            </div>
        </section>
    )
}

export default UsageGuideSection


