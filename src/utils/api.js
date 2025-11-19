import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
    baseURL: API_BASE_URL,
    // multipart/form-data는 FormData를 보낼 때 axios가 자동으로 boundary를 포함한 Content-Type을 설정하므로
    // 기본 헤더에 설정하지 않음 (필요한 경우 개별 요청에서만 설정)
})

/**
 * URL에서 이미지를 다운로드하여 File 객체로 변환 (CORS 문제 해결을 위해 프록시 사용)
 * @param {string} url - 이미지 URL (S3 URL인 경우 프록시를 통해 가져옴)
 * @param {string} filename - 파일명
 * @returns {Promise<File>} File 객체
 */
const urlToFile = async (url, filename = 'dress.jpg') => {
    // S3 URL이거나 외부 URL인 경우 백엔드 프록시를 통해 가져오기
    const isExternalUrl = url.startsWith('http://') || url.startsWith('https://')
    const proxyUrl = isExternalUrl
        ? `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(url)}`
        : url

    const response = await fetch(proxyUrl)
    if (!response.ok) {
        throw new Error(`이미지를 가져올 수 없습니다: ${response.statusText}`)
    }
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
}

/**
 * 자동 매칭 API 호출 (일반 탭: 사람 + 드레스 + 배경) - X.AI + Gemini 2.5 V2
 * @param {File} personImage - 사용자 사진
 * @param {Object|File} dressData - 드레스 데이터 (id, name, image, originalUrl) 또는 File 객체
 * @param {File} backgroundImage - 배경 이미지 파일
 * @returns {Promise} 매칭된 이미지 결과
 */
export const autoMatchImage = async (personImage, dressData, backgroundImage) => {
    try {
        const formData = new FormData()
        formData.append('person_image', personImage)

        // 드레스 이미지 처리
        if (dressData instanceof File) {
            formData.append('garment_image', dressData)
        } else if (dressData.originalUrl || dressData.image) {
            // 드레스 URL이 있는 경우 File 객체로 변환
            const dressUrl = dressData.originalUrl || dressData.image
            const dressFile = await urlToFile(dressUrl, 'dress.jpg')
            formData.append('garment_image', dressFile)
        } else {
            throw new Error('드레스 이미지가 필요합니다.')
        }

        // 배경 이미지 추가
        if (!backgroundImage) {
            throw new Error('배경 이미지가 필요합니다.')
        }
        formData.append('background_image', backgroundImage)

        const response = await api.post('/api/compose_xai_gemini_v2', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    } catch (error) {
        console.error('자동 매칭 오류:', error)
        throw error
    }
}

/**
 * 배경 제거 API 호출 (드레스만 추출)
 * @param {File} image - 배경을 제거할 이미지
 * @returns {Promise} 배경이 제거된 이미지 결과
 */
export const removeBackground = async (image) => {
    try {
        const formData = new FormData()
        formData.append('file', image)

        const response = await api.post('/api/segment', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        // response.data 형식:
        // {
        //   success: true,
        //   result_image: "data:image/png;base64,..." (Base64 문자열)
        //   dress_detected: true,
        //   dress_percentage: 45.67,
        //   message: "드레스 영역: 45.67% 감지됨"
        // }
        return {
            success: response.data.success,
            image: response.data.result_image,
            message: response.data.message
        }
    } catch (error) {
        console.error('배경 제거 오류:', error)
        throw error
    }
}

/**
 * 커스텀 매칭 API 호출 (전신사진 + 드레스 이미지 합성)
 * @param {File} fullBodyImage - 전신 사진
 * @param {File} dressImage - 드레스 이미지
 * @param {File} backgroundImage - 배경 이미지 (선택사항)
 * @returns {Promise} 매칭된 결과 이미지
 */
export const customMatchImage = async (fullBodyImage, dressImage, backgroundImage = null) => {
    try {
        const formData = new FormData()
        formData.append('person_image', fullBodyImage)
        formData.append('garment_image', dressImage)

        // 배경 이미지가 제공된 경우 추가
        if (backgroundImage) {
            formData.append('background_image', backgroundImage)
        } else {
            throw new Error('배경 이미지가 필요합니다.')
        }

        const response = await api.post('/api/compose_xai_gemini_v2', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        // response.data 형식:
        // {
        //   success: true,
        //   result_image: "data:image/png;base64,..." (Base64 문자열)
        //   message: "이미지 합성이 완료되었습니다."
        // }
        return response.data
    } catch (error) {
        console.error('커스텀 매칭 오류:', error)
        throw error
    }
}

/**
 * 드레스 세그멘테이션 API 호출
 * @param {File} image - 세그멘테이션할 이미지
 * @returns {Promise} 세그멘테이션된 결과
 */
export const segmentDress = async (image) => {
    try {
        const formData = new FormData()
        formData.append('file', image)

        const response = await api.post('/api/segment', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    } catch (error) {
        console.error('드레스 세그멘테이션 오류:', error)
        throw error
    }
}

/**
 * 이미지 분석 API 호출 (세그멘테이션 분석)
 * @param {File} image - 분석할 이미지
 * @returns {Promise} 분석 결과
 */
export const analyzeImage = async (image) => {
    try {
        const formData = new FormData()
        formData.append('file', image)

        const response = await api.post('/api/analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    } catch (error) {
        console.error('이미지 분석 오류:', error)
        throw error
    }
}

/**
 * 체형 분석 API 호출 (MediaPipe 기반 체형 분석)
 * @param {File} image - 전신 이미지 파일
 * @param {number} height - 키 (cm)
 * @param {number} weight - 몸무게 (kg)
 * @returns {Promise} 체형 분석 결과
 */
export const analyzeBody = async (image, height, weight) => {
    try {
        const formData = new FormData()
        formData.append('file', image)
        formData.append('height', height || 0)
        formData.append('weight', weight || 0)

        // axios는 FormData를 감지하면 자동으로 multipart/form-data Content-Type을 설정
        const response = await api.post('/api/analyze-body', formData)

        return response.data
    } catch (error) {
        console.error('체형 분석 오류:', error)
        throw error
    }
}

/**
 * 서버 상태 확인
 * @returns {Promise} 서버 상태
 */
export const healthCheck = async () => {
    try {
        const response = await api.get('/health')
        return response.data
    } catch (error) {
        console.error('헬스 체크 오류:', error)
        throw error
    }
}

/**
 * 이미지를 Base64로 변환
 * @param {File} file - 변환할 파일
 * @returns {Promise<string>} Base64 문자열
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * 드레스 목록 조회 (전체)
 * @returns {Promise} 드레스 목록
 */
/**
 * 이미지에 필터 적용
 * @param {File|string} image - 이미지 파일 또는 이미지 URL/Data URL
 * @param {string} filterPreset - 필터 프리셋 (none, grayscale, vintage, warm, cool, high_contrast)
 * @returns {Promise} 필터가 적용된 이미지 결과
 */
export const applyImageFilter = async (image, filterPreset = 'none') => {
    try {
        const formData = new FormData()

        // 이미지가 File 객체인지 URL/Data URL인지 확인
        if (image instanceof File) {
            formData.append('file', image)
        } else if (typeof image === 'string') {
            // Data URL 또는 URL인 경우 File 객체로 변환
            let imageFile
            if (image.startsWith('data:')) {
                // Data URL인 경우
                const response = await fetch(image)
                const blob = await response.blob()
                imageFile = new File([blob], 'image.png', { type: blob.type })
            } else {
                // URL인 경우
                imageFile = await urlToFile(image, 'image.png')
            }
            formData.append('file', imageFile)
        } else {
            throw new Error('이미지 형식이 올바르지 않습니다.')
        }

        formData.append('filter_preset', filterPreset)

        const response = await api.post('/api/apply-image-filters', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        if (response.data.success) {
            return {
                success: true,
                resultImage: response.data.result_image,
                filterPreset: response.data.filter_preset,
                message: response.data.message,
            }
        } else {
            throw new Error(response.data.message || '필터 적용에 실패했습니다.')
        }
    } catch (error) {
        console.error('필터 적용 중 오류 발생:', error)
        throw error
    }
}

export const getDresses = async () => {
    try {
        // limit를 크게 설정하여 모든 드레스 가져오기
        const response = await api.get('/api/admin/dresses?limit=1000', {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        return response.data
    } catch (error) {
        console.error('드레스 목록 조회 오류:', error)
        throw error
    }
}

export default api

