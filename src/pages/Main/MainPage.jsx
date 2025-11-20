import VideoBackground from './VideoBackground'
import AboutUs from './AboutUs'
import DomeGallery from './DomeGallery'
import DressCollection from './DressCollection'
import UsageGuideSection from './UsageGuideSection'
import FAQSection from './FAQSection'
import NextSection from './NextSection'
import ScrollToTop from './ScrollToTop'

const MainPage = ({ onNavigateToFitting, onNavigateToGeneral, onNavigateToCustom, onNavigateToAnalysis }) => {
    return (
        <>
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
        </>
    )
}

export default MainPage

