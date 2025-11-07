import { useState } from 'react'
import '../styles/BodyTypeFitting.css'

const BodyAnalysis = ({ onBackToMain }) => {
    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">체형 분석</h2>
                            <div className="tab-guide-text">
                                AI가 당신의 체형을 자동으로 분석하고 최적의 드레스를 추천해드립니다
                            </div>
                        </div>

                        {/* 컨텐츠 */}
                        <div className="tab-content">
                            <div className="analysis-content">
                                <h3 className="content-title">AI 체형 분석</h3>
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
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default BodyAnalysis

