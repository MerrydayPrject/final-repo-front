import { useState, useEffect } from 'react'
import '../../styles/Main/ScrollToTop.css'

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            // 메인 페이지 최하단(NextSection 이후)에서만 버튼 표시
            // document.body.offsetHeight 대신 실제 메인 콘텐츠의 끝을 확인
            const scrollHeight = document.documentElement.scrollHeight
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const clientHeight = document.documentElement.clientHeight

            // 페이지 하단 200px 이내에 도달하면 버튼 표시
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)

        // 초기 상태 확인
        toggleVisibility()

        return () => {
            window.removeEventListener('scroll', toggleVisibility)
        }
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <button
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="맨 위로 이동"
        >
            <svg
                className="scroll-to-top-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* 우아한 위쪽 화살표 */}
                <path
                    d="M12 6L12 18M12 6L6 12M12 6L18 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* 곡선 장식 */}
                <path
                    d="M12 6C12 6 8 10 8 12"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                />
                <path
                    d="M12 6C12 6 16 10 16 12"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                />
            </svg>
        </button>
    )
}

export default ScrollToTop

