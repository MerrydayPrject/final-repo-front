import { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { MdOutlineDownload } from 'react-icons/md'
import { convertTo3D, check3DStatus, getProxy3DModelUrl } from '../utils/api'
import '../styles/ThreeDViewer.css'

function Model({ url }) {
    // CORS 문제 해결을 위해 프록시 URL 사용
    const proxyUrl = getProxy3DModelUrl(url)
    const { scene } = useGLTF(proxyUrl || url)
    return <primitive object={scene} />
}

function LoadingSpinner() {
    return (
        <div className="three-d-loading">
            <div className="three-d-spinner"></div>
            <p>3D 모델 로딩 중...</p>
        </div>
    )
}

const WEDDING_MESSAGES = [
    "사랑은 서로를 바라보는 것이 아니라, 함께 같은 방향을 바라보는 것이다.",
    "오늘의 약속이 내일의 추억이 됩니다.",
    "두 사람의 이야기가 이제 하나의 시작으로 이어집니다.",
    "사랑은 작은 일상 속에서 자라납니다.",
    "서로의 손을 잡는 순간, 모든 것이 완벽해집니다.",
    "평생 함께할 순간을 위해 오늘을 기념하세요.",
    "결혼은 두 마음이 하나의 여행을 떠나는 시작입니다.",
    "당신과 함께라서 매일이 특별합니다.",
    "오늘의 설렘이 내일의 행복으로 이어집니다.",
    "사랑으로 맺어진 우리, 오늘을 기억합니다.",
    "웨딩드레스는 꿈의 시작, 사랑은 그 완성입니다.",
    "두 사람이 함께 만드는 가장 아름다운 순간.",
    "작은 손짓 하나에도 사랑이 담깁니다.",
    "행복은 완벽함이 아니라 서로의 부족함을 이해하는 데서 옵니다.",
    "오늘, 당신과 나의 이야기가 시작됩니다.",
    "함께라서 더 빛나는 우리의 이야기.",
    "사랑은 서로의 미소를 지켜주는 일입니다.",
    "손을 잡는 순간, 세상은 두 사람만의 공간이 됩니다.",
    "결혼은 서로에게 가장 친한 친구가 되는 일입니다.",
    "사랑은 시간을 초월한 작은 기적입니다.",
    "두 사람이 함께하는 순간이 가장 아름답습니다.",
    "오늘의 감동이 평생의 추억이 됩니다.",
    "서로의 마음을 이해하는 것이 진정한 사랑입니다.",
    "사랑으로 시작해 사랑으로 이어지는 길.",
    "함께 걷는 이 길이 우리의 미래입니다.",
    "당신과 나, 이제 우리는 하나입니다.",
    "행복은 서로의 마음 속에 작은 빛을 켜는 것.",
    "웨딩드레스 속에 담긴 작은 설렘, 영원히 기억하세요.",
    "사랑은 서로를 완벽하게 만드는 것이 아니라, 함께 성장하는 것입니다.",
    "서로의 미소가 가장 큰 선물입니다.",
    "두 사람의 약속이 오늘을 특별하게 만듭니다.",
    "사랑은 함께 나누는 모든 순간 속에 있습니다.",
    "오늘의 기쁨이 내일의 행복으로 이어집니다.",
    "서로의 눈빛 속에서 미래를 봅니다.",
    "결혼은 서로의 이야기에 새로운 장을 여는 순간입니다.",
    "함께하는 오늘이 가장 소중합니다.",
    "사랑은 작은 배려에서 시작됩니다.",
    "당신과 나, 이제 우리의 시간이 시작됩니다.",
    "서로의 마음을 이어주는 가장 따뜻한 순간.",
    "평생을 함께할 설렘, 오늘 여기서 시작됩니다."
]

function StatusDisplay({ status, progress, message }) {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
    const [fade, setFade] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false)
            setTimeout(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % WEDDING_MESSAGES.length)
                setFade(true)
            }, 300) // 페이드 아웃 후 전환
        }, 4000) // 4초마다 전환

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="three-d-status">
            <div className="bubble-container">
                <div className="bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className="bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className="bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className="bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className="bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <div className="status-message-container">
                <p className={`status-message ${fade ? 'fade-in' : 'fade-out'}`}>
                    {WEDDING_MESSAGES[currentMessageIndex]}
                </p>
            </div>
            {progress !== undefined && progress !== null && (
                <div className="progress-container">
                    <div className="progress-bar-wrapper">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="progress-text">{progress}%</span>
                    </div>
                </div>
            )}
            <div className="status-note-container">
                <p className="status-note">3D 모델 생성 중입니다. 2-5분 정도 소요될 수 있습니다.</p>
            </div>
        </div>
    )
}

export default function ThreeDViewer({
    previewImage,
    autoConvert = false,
    onConvert,
    onError,
    onModelReady
}) {
    const [modelUrl, setModelUrl] = useState(null)
    const [originalModelUrl, setOriginalModelUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [status, setStatus] = useState(null)
    const [progress, setProgress] = useState(0)
    const [taskId, setTaskId] = useState(null)
    const [isModelReady, setIsModelReady] = useState(false)
    const statusCheckInterval = useRef(null)

    // 상태 확인 중단
    const stopStatusCheck = () => {
        if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current)
            statusCheckInterval.current = null
        }
    }

    // 상태 확인 시작
    const startStatusCheck = (taskId) => {
        stopStatusCheck()

        statusCheckInterval.current = setInterval(async () => {
            try {
                const result = await check3DStatus(taskId, false)

                if (result.success) {
                    setStatus(result.status)
                    setProgress(result.progress || 0)

                    if (result.status === 'SUCCEEDED') {
                        stopStatusCheck()
                        setLoading(false)

                        // GLB 파일 URL 가져오기
                        const modelUrls = result.model_urls || {}
                        const glbUrl = modelUrls.glb || modelUrls.fbx || Object.values(modelUrls)[0]

                        if (glbUrl) {
                            setModelUrl(glbUrl)
                            setOriginalModelUrl(glbUrl) // 원본 URL 저장 (다운로드용)
                            setIsModelReady(true)
                            if (onConvert) {
                                onConvert(glbUrl)
                            }
                            if (onModelReady) {
                                onModelReady(true)
                            }
                        } else {
                            setError('3D 모델 URL을 받지 못했습니다.')
                            if (onError) {
                                onError('3D 모델 URL을 받지 못했습니다.')
                            }
                        }
                    } else if (result.status === 'FAILED') {
                        stopStatusCheck()
                        setLoading(false)
                        setError(result.message || '3D 변환에 실패했습니다.')
                        if (onError) {
                            onError(result.message || '3D 변환에 실패했습니다.')
                        }
                    }
                } else {
                    stopStatusCheck()
                    setLoading(false)
                    setError(result.error || '상태 확인 중 오류가 발생했습니다.')
                    if (onError) {
                        onError(result.error || '상태 확인 중 오류가 발생했습니다.')
                    }
                }
            } catch (err) {
                console.error('상태 확인 오류:', err)
                // 일시적 오류는 무시하고 계속 확인
            }
        }, 3000) // 3초마다 확인
    }

    // 3D 변환 시작
    const handleConvert = async (image) => {
        if (!image) {
            setError('이미지가 없습니다.')
            return
        }

        setLoading(true)
        setError(null)
        setModelUrl(null)
        setStatus('PENDING')
        setProgress(0)
        stopStatusCheck()

        try {
            const result = await convertTo3D(image)

            if (result.success && result.task_id) {
                setTaskId(result.task_id)
                setStatus('PENDING')
                setProgress(0)
                // 상태 확인 시작
                startStatusCheck(result.task_id)
            } else {
                throw new Error(result.message || '3D 변환 작업을 시작할 수 없습니다.')
            }
        } catch (err) {
            console.error('3D 변환 오류:', err)
            setLoading(false)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || '3D 변환 중 오류가 발생했습니다.'
            setError(errorMessage)
            if (onError) {
                onError(errorMessage)
            }
        }
    }

    // autoConvert가 true이고 previewImage가 변경되면 자동 변환
    useEffect(() => {
        if (autoConvert && previewImage) {
            handleConvert(previewImage)
        }

        // 컴포넌트 언마운트 시 상태 확인 중단
        return () => {
            stopStatusCheck()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoConvert, previewImage])

    return (
        <div className="three-d-viewer-container">
            {error && (
                <div className="three-d-error">
                    <p>오류: {error}</p>
                    <button onClick={() => {
                        setError(null)
                        if (previewImage) {
                            handleConvert(previewImage)
                        }
                    }}>
                        다시 시도
                    </button>
                </div>
            )}

            {loading && !modelUrl && (
                <StatusDisplay
                    status={status}
                    progress={progress}
                    message={status === 'PENDING' ? '작업 대기 중...' :
                        status === 'IN_PROGRESS' ? '3D 모델 생성 중...' :
                            '처리 중...'}
                />
            )}

            {modelUrl ? (
                <div className="three-d-canvas-wrapper">
                    <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
                        <Suspense fallback={null}>
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[5, 5, 5]} intensity={1} />
                            <pointLight position={[-5, -5, -5]} intensity={0.5} />
                            <Model url={modelUrl} />
                            <OrbitControls
                                enablePan={true}
                                enableZoom={true}
                                enableRotate={true}
                                minDistance={1}
                                maxDistance={10}
                            />
                            <Environment preset="sunset" />
                        </Suspense>
                    </Canvas>
                    <button
                        className="three-d-download-button"
                        onClick={async () => {
                            try {
                                // 프록시 URL을 통해 다운로드
                                const proxyUrl = getProxy3DModelUrl(originalModelUrl || modelUrl)
                                const response = await fetch(proxyUrl)
                                const blob = await response.blob()

                                // 다운로드 링크 생성
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = '3d_model.glb'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                window.URL.revokeObjectURL(url)
                            } catch (err) {
                                console.error('3D 모델 다운로드 오류:', err)
                                alert('3D 모델 다운로드 중 오류가 발생했습니다.')
                            }
                        }}
                        title="3D 모델 다운로드"
                    >
                        <MdOutlineDownload /> 다운로드
                    </button>
                </div>
            ) : !loading && !error && (
                <div className="three-d-placeholder">
                    <p>3D 모델이 표시됩니다</p>
                </div>
            )}
        </div>
    )
}

