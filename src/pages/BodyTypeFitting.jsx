import { useState } from 'react'
import '../styles/BodyTypeFitting.css'

const BodyTypeFitting = ({ onBackToMain }) => {
    const [activeTab, setActiveTab] = useState('analysis') // 'analysis' or 'correction'

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">AI 체형 피팅</h2>
                            <div className="tab-guide-text">
                                AI가 당신의 체형을 분석하고 최적의 드레스를 추천해드립니다
                            </div>
                        </div>

                        {/* 탭 메뉴 */}
                        <div className="tab-menu">
                            <button
                                className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analysis')}
                            >
                                체형 분석
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'correction' ? 'active' : ''}`}
                                onClick={() => setActiveTab('correction')}
                            >
                                체형 보정
                            </button>
                        </div>

                        {/* 탭 컨텐츠 */}
                        <div className="tab-content">
                            {activeTab === 'analysis' ? (
                                <div className="analysis-content">
                                    <h3 className="content-title">체형 분석</h3>
                                    <div className="content-description">
                                        전신 사진을 업로드하면 AI가 체형을 자동으로 분석합니다
                                    </div>

                                    <div className="upload-section">
                                        <div className="upload-box">
                                            <div className="upload-icon">📸</div>
                                            <p className="upload-text">전신 사진을 업로드해주세요</p>
                                            <button className="upload-button">파일 선택</button>
                                        </div>
                                    </div>

                                    <div className="info-section">
                                        <h4>AI 체형 분석 기능</h4>
                                        <ul className="feature-list">
                                            <li>자동 체형 유형 분석 (어깨, 허리, 엉덩이 비율)</li>
                                            <li>체형별 맞춤 드레스 추천</li>
                                            <li>3D 신체 측정값 제공</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="correction-content">
                                    <h3 className="content-title">체형 보정</h3>
                                    <div className="content-description">
                                        원하는 부위를 선택하여 체형을 자연스럽게 보정할 수 있습니다
                                    </div>

                                    <div className="upload-section">
                                        <div className="upload-box">
                                            <div className="upload-icon">📸</div>
                                            <p className="upload-text">보정할 사진을 업로드해주세요</p>
                                            <button className="upload-button">파일 선택</button>
                                        </div>
                                    </div>

                                    <div className="info-section">
                                        <h4>체형 보정 기능</h4>
                                        <ul className="feature-list">
                                            <li>자연스러운 AI 보정 (허리, 다리, 어깨 등)</li>
                                            <li>강도 조절 가능한 실시간 프리뷰</li>
                                            <li>원본과 비교 기능</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default BodyTypeFitting

