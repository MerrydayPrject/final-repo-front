import { useEffect, useMemo, useRef, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import '../styles/DomeGallery.css'

const DEFAULT_IMAGES = [
    { src: '/Image/n1.png', alt: 'Image 1' },
    { src: '/Image/n2.png', alt: 'Image 2' },
    { src: '/Image/n3.png', alt: 'Image 3' },
    { src: '/Image/n4.png', alt: 'Image 4' },
    { src: '/Image/n5.png', alt: 'Image 5' },
    { src: '/Image/n6.png', alt: 'Image 6' },
    { src: '/Image/n7.png', alt: 'Image 7' },
    { src: '/Image/n8.png', alt: 'Image 8' },
    { src: '/Image/n9.png', alt: 'Image 9' },
    { src: '/Image/n10.png', alt: 'Image 10' },
    { src: '/Image/n11.png', alt: 'Image 11' },
    { src: '/Image/n12.png', alt: 'Image 12' },
    { src: '/Image/n13.png', alt: 'Image 13' },
    { src: '/Image/n14.png', alt: 'Image 14' },
    { src: '/Image/n15.png', alt: 'Image 15' },
    { src: '/Image/n16.png', alt: 'Image 16' },
    { src: '/Image/n17.png', alt: 'Image 17' },
    { src: '/Image/n18.png', alt: 'Image 18' },
    { src: '/Image/n19.png', alt: 'Image 19' },
    { src: '/Image/n20.png', alt: 'Image 20' },
    { src: '/Image/n21.png', alt: 'Image 21' },
    { src: '/Image/n22.png', alt: 'Image 22' },
    { src: '/Image/n23.png', alt: 'Image 23' },
    { src: '/Image/n24.png', alt: 'Image 24' },
    { src: '/Image/n23.png', alt: 'Image 23' },
    { src: '/Image/n23.png', alt: 'Image 23' },
    { src: '/Image/n25.png', alt: 'Image 25' },
    { src: '/Image/n26.png', alt: 'Image 26' },
    { src: '/Image/n27.png', alt: 'Image 27' },
    { src: '/Image/n28.png', alt: 'Image 28' },
    { src: '/Image/n29.png', alt: 'Image 29' },
    { src: '/Image/n30.png', alt: 'Image 30' }
]

const DEFAULTS = {
    maxVerticalRotationDeg: 5,
    dragSensitivity: 20,
    segments: 35
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const normalizeAngle = (d) => ((d % 360) + 360) % 360
const wrapAngleSigned = (deg) => {
    const a = (((deg + 180) % 360) + 360) % 360
    return a - 180
}
function buildItems(pool, seg) {
    const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
    const evenYs = [-4, -2, 0, 2, 4]
    const oddYs = [-3, -1, 1, 3, 5]

    const coords = xCols.flatMap((x, c) => {
        const ys = c % 2 === 0 ? evenYs : oddYs
        return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }))
    })

    const totalSlots = coords.length
    if (pool.length === 0) {
        return coords.map((c) => ({ ...c, src: '', alt: '' }))
    }
    if (pool.length > totalSlots) {
        console.warn(
            `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`
        )
    }

    const normalizedImages = pool.map((image) => {
        if (typeof image === 'string') {
            return { src: image, alt: '' }
        }
        return { src: image.src || '', alt: image.alt || '' }
    })

    const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length])

    for (let i = 1; i < usedImages.length; i += 1) {
        if (usedImages[i].src === usedImages[i - 1].src) {
            for (let j = i + 1; j < usedImages.length; j += 1) {
                if (usedImages[j].src !== usedImages[i].src) {
                    const tmp = usedImages[i]
                    usedImages[i] = usedImages[j]
                    usedImages[j] = tmp
                    break
                }
            }
        }
    }

    return coords.map((c, i) => ({
        ...c,
        src: usedImages[i].src,
        alt: usedImages[i].alt
    }))
}

export default function DomeGallery({
    images = DEFAULT_IMAGES,
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 600,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#ffffff',
    maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity = DEFAULTS.dragSensitivity,
    segments = DEFAULTS.segments,
    dragDampening = 2,
    imageBorderRadius = '30px',
    grayscale = false
}) {
    const rootRef = useRef(null)
    const mainRef = useRef(null)
    const sphereRef = useRef(null)

    const rotationRef = useRef({ x: 0, y: 0 })
    const startRotRef = useRef({ x: 0, y: 0 })
    const startPosRef = useRef(null)
    const draggingRef = useRef(false)
    const movedRef = useRef(false)
    const inertiaRAF = useRef(null)
    const autoRotateRAF = useRef(null)
    const autoRotateSpeed = useRef(0.08) // 회전 속도 (deg per frame)

    const items = useMemo(() => buildItems(images, segments), [images, segments])

    const applyTransform = (xDeg, yDeg) => {
        const el = sphereRef.current
        if (el) {
            el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
        }
    }

    const lockedRadiusRef = useRef(null)

    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const ro = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect
            const w = Math.max(1, cr.width)
            const h = Math.max(1, cr.height)
            const minDim = Math.min(w, h)
            const maxDim = Math.max(w, h)
            const aspect = w / h
            let basis
            switch (fitBasis) {
                case 'min':
                    basis = minDim
                    break
                case 'max':
                    basis = maxDim
                    break
                case 'width':
                    basis = w
                    break
                case 'height':
                    basis = h
                    break
                default:
                    basis = aspect >= 1.3 ? w : minDim
            }
            let radius = basis * fit
            const heightGuard = h * 1.35
            radius = Math.min(radius, heightGuard)
            radius = clamp(radius, minRadius, maxRadius)
            lockedRadiusRef.current = Math.round(radius)

            const viewerPad = Math.max(8, Math.round(minDim * padFactor))
            root.style.setProperty('--radius', `${lockedRadiusRef.current}px`)
            root.style.setProperty('--viewer-pad', `${viewerPad}px`)
            root.style.setProperty('--overlay-blur-color', overlayBlurColor)
            root.style.setProperty('--tile-radius', imageBorderRadius)
            root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none')
            applyTransform(rotationRef.current.x, rotationRef.current.y)
        })
        ro.observe(root)
        return () => ro.disconnect()
    }, [
        fit,
        fitBasis,
        minRadius,
        maxRadius,
        padFactor,
        overlayBlurColor,
        grayscale,
        imageBorderRadius
    ])

    useEffect(() => {
        applyTransform(rotationRef.current.x, rotationRef.current.y)
    }, [])

    // 자동 회전 기능
    useEffect(() => {
        const autoRotate = () => {
            if (!draggingRef.current && !inertiaRAF.current) {
                const nextY = wrapAngleSigned(rotationRef.current.y + autoRotateSpeed.current)
                rotationRef.current = { ...rotationRef.current, y: nextY }
                applyTransform(rotationRef.current.x, nextY)
            }
            autoRotateRAF.current = requestAnimationFrame(autoRotate)
        }
        autoRotateRAF.current = requestAnimationFrame(autoRotate)
        return () => {
            if (autoRotateRAF.current) {
                cancelAnimationFrame(autoRotateRAF.current)
                autoRotateRAF.current = null
            }
        }
    }, [])

    const stopInertia = useCallback(() => {
        if (inertiaRAF.current) {
            cancelAnimationFrame(inertiaRAF.current)
            inertiaRAF.current = null
        }
    }, [])

    const startInertia = useCallback(
        (vx, vy) => {
            const MAX_V = 1.4
            let vX = clamp(vx, -MAX_V, MAX_V) * 80
            let vY = clamp(vy, -MAX_V, MAX_V) * 80
            let frames = 0
            const d = clamp(dragDampening ?? 0.6, 0, 1)
            const frictionMul = 0.94 + 0.055 * d
            const stopThreshold = 0.015 - 0.01 * d
            const maxFrames = Math.round(90 + 270 * d)
            const step = () => {
                vX *= frictionMul
                vY *= frictionMul
                if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
                    inertiaRAF.current = null
                    return
                }
                if (++frames > maxFrames) {
                    inertiaRAF.current = null
                    return
                }
                const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg)
                const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200)
                rotationRef.current = { x: nextX, y: nextY }
                applyTransform(nextX, nextY)
                inertiaRAF.current = requestAnimationFrame(step)
            }
            stopInertia()
            inertiaRAF.current = requestAnimationFrame(step)
        },
        [dragDampening, maxVerticalRotationDeg, stopInertia]
    )

    useGesture(
        {
            onDragStart: ({ event }) => {
                stopInertia()
                const evt = event
                draggingRef.current = true
                movedRef.current = false
                startRotRef.current = { ...rotationRef.current }
                startPosRef.current = { x: evt.clientX, y: evt.clientY }
            },
            onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
                if (!draggingRef.current || !startPosRef.current) return
                const evt = event
                const dxTotal = evt.clientX - startPosRef.current.x
                const dyTotal = evt.clientY - startPosRef.current.y
                if (!movedRef.current) {
                    const dist2 = dxTotal * dxTotal + dyTotal * dyTotal
                    if (dist2 > 16) movedRef.current = true
                }
                const nextX = clamp(
                    startRotRef.current.x - dyTotal / dragSensitivity,
                    -maxVerticalRotationDeg,
                    maxVerticalRotationDeg
                )
                const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity)
                if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
                    rotationRef.current = { x: nextX, y: nextY }
                    applyTransform(nextX, nextY)
                }
                if (last) {
                    draggingRef.current = false
                    let [vMagX, vMagY] = velocity
                    const [dirX, dirY] = direction
                    let vx = vMagX * dirX
                    let vy = vMagY * dirY
                    if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
                        const [mx, my] = movement
                        vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2)
                        vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2)
                    }
                    if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy)
                    movedRef.current = false
                }
            }
        },
        { target: mainRef, eventOptions: { passive: true } }
    )

    return (
        <div
            ref={rootRef}
            className="sphere-root"
            style={{
                ['--segments-x']: segments,
                ['--segments-y']: segments,
                ['--overlay-blur-color']: overlayBlurColor,
                ['--tile-radius']: imageBorderRadius,
                ['--image-filter']: grayscale ? 'grayscale(1)' : 'none'
            }}
        >
            <main ref={mainRef} className="sphere-main">
                <div className="stage">
                    <div ref={sphereRef} className="sphere">
                        {items.map((it, i) => (
                            <div
                                key={`${it.x},${it.y},${i}`}
                                className="item"
                                data-src={it.src}
                                data-offset-x={it.x}
                                data-offset-y={it.y}
                                data-size-x={it.sizeX}
                                data-size-y={it.sizeY}
                                style={{
                                    ['--offset-x']: it.x,
                                    ['--offset-y']: it.y,
                                    ['--item-size-x']: it.sizeX,
                                    ['--item-size-y']: it.sizeY
                                }}
                            >
                                <div className="item__image">
                                    <img src={it.src} draggable={false} alt={it.alt} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overlay" />
                <div className="overlay overlay--blur" />
                <div className="edge-fade edge-fade--top" />
                <div className="edge-fade edge-fade--bottom" />
            </main>
        </div>
    )
}

