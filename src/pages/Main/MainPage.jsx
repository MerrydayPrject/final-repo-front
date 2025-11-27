import { useState, useEffect } from 'react'
import VideoBackground from './VideoBackground'
import AboutUs from './AboutUs'
import DomeGallery from './DomeGallery'
import DressCollection from './DressCollection'
import UsageGuideSection from './UsageGuideSection'
import FAQSection from './FAQSection'
import NextSection from './NextSection'
import ScrollToTop from './ScrollToTop'
import Modal from '../../components/Modal'
import { Helmet } from 'react-helmet'
import { countVisitor } from '../../utils/api'

const MainPage = ({ onNavigateToFitting, onNavigateToGeneral, onNavigateToCustom, onNavigateToAnalysis }) => {
    const [showBetaModal, setShowBetaModal] = useState(false)

    useEffect(() => {
        // sessionStorage에서 이미 모달을 봤는지 확인
        const hasSeenBetaModal = sessionStorage.getItem('hasSeenBetaModal')

        if (!hasSeenBetaModal) {
            // 2초 후 모달 표시 및 방문자 카운트 (페이지를 완전히 껐다가 다시 키는 경우만)
            const timer = setTimeout(() => {
                setShowBetaModal(true)
                // 모달 표시 시 방문자 카운트 (새 세션 시작 시에만)
                countVisitor().catch(() => {
                    // 에러는 조용히 처리
                })
            }, 2000)

            return () => clearTimeout(timer)
        }
        // 새로고침 시에는 sessionStorage에 값이 있어서 모달이 안 뜨고, 카운팅도 안 됨
    }, [])

    const handleCloseBetaModal = () => {
        setShowBetaModal(false)
        // sessionStorage에 모달을 봤다는 표시 저장 (탭을 닫으면 사라짐)
        sessionStorage.setItem('hasSeenBetaModal', 'true')
    }

    return (
        <>
            <Helmet>
                <title>Marryday | AI 웨딩드레스 추천 서비스</title>
                <meta
                    name="description"
                    content="사진만 업로드하면 AI가 어울리는 웨딩드레스를 추천해드려요. 무료로 체험해보세요."
                />
                <meta
                    name="keywords"
                    content="Marryday, 웨딩드레스, AI 피팅, 결혼 준비, 예비신부, 드레스 추천"
                />
                <meta property="og:title" content="Marryday | AI 웨딩드레스 추천" />
                <meta
                    property="og:description"
                    content="AI가 제안하는 맞춤 웨딩드레스 피팅을 바로 경험해보세요."
                />
            </Helmet>
            <VideoBackground onNavigateToFitting={onNavigateToFitting} />
            <AboutUs
                onNavigateToGeneral={onNavigateToGeneral}
                onNavigateToCustom={onNavigateToCustom}
                onNavigateToAnalysis={onNavigateToAnalysis}
            />
            <section className="dome-gallery-section">
                <div className="dome-gallery-header">
                    <h2 className="dome-gallery-title">다양한 드레스를 피팅해보세요</h2>
                </div>
                <DomeGallery />
            </section>
            <DressCollection />
            <UsageGuideSection />
            <FAQSection />
            <NextSection />
            <ScrollToTop />
            <Modal
                isOpen={showBetaModal}
                onClose={handleCloseBetaModal}
                message=""
                center={true}
            >
                <div style={{ textAlign: 'left', lineHeight: '1.8', transform: 'translateY(20px)' }}>
                    <div style={{ fontSize: '16px', marginBottom: '12px' }}>해당 페이지는 Beta 버전이므로 서버운영 시간은</div>
                    <div>월요일,목요일: 12:00~21:00</div>
                    <div>화요일,수요일,금요일: 09:00~18:00 입니다.</div>
                    <div style={{ marginTop: '12px' }}>양해부탁드립니다.</div>
                </div>
            </Modal>
        </>
    )
}

export default MainPage

