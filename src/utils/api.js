import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
})

/**
 * URL에서 이미지를 다운로드하여 File 객체로 변환
 * @param {string} url - 이미지 URL
 * @param {string} filename - 파일명
 * @returns {Promise<File>} File 객체
 */
const urlToFile = async (url, filename = 'dress.jpg') => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
}

/**
 * 자동 매칭 API 호출 (일반 탭: 사람 + 드레스)
 * @param {File} personImage - 사용자 사진
 * @param {Object} dressData - 드레스 데이터 (id, name, image)
 * @returns {Promise} 매칭된 이미지 결과
 */
export const autoMatchImage = async (personImage, dressData) => {
    try {
        const formData = new FormData()
        formData.append('person_image', personImage)

        // 드레스 이미지가 파일인 경우
        if (dressData instanceof File) {
            formData.append('dress_image', dressData)
        } else if (dressData.originalUrl || dressData.image) {
            // 드레스 URL이 있는 경우 백엔드에서 다운로드하도록 URL 전달
            // originalUrl이 있으면 원본 S3 URL 사용, 없으면 image 사용
            formData.append('dress_url', dressData.originalUrl || dressData.image)
        }

        const response = await api.post('/api/compose-dress', formData, {
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
 * @returns {Promise} 매칭된 결과 이미지
 */
export const customMatchImage = async (fullBodyImage, dressImage) => {
    try {
        const formData = new FormData()
        formData.append('person_image', fullBodyImage)
        formData.append('dress_image', dressImage)

        const response = await api.post('/api/compose-dress', formData, {
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
 * 이미지 분석 API 호출
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

/**
 * 3D 변환 API 호출
 * @param {File|string} image - 변환할 이미지 (File 객체 또는 Base64 문자열)
 * @returns {Promise} 3D 변환된 이미지 결과
 */
export const convertTo3D = async (image) => {
    try {
        const formData = new FormData()

        // 이미지가 Base64 문자열인 경우 Blob으로 변환
        if (typeof image === 'string' && image.startsWith('data:')) {
            const response = await fetch(image)
            const blob = await response.blob()
            const file = new File([blob], 'image.png', { type: blob.type })
            formData.append('image', file)
        } else if (image instanceof File) {
            formData.append('image', image)
        } else {
            throw new Error('지원하지 않는 이미지 형식입니다.')
        }

        const response = await api.post('/api/convert-3d', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        // response.data 형식:
        // {
        //   success: true,
        //   result_image: "data:image/png;base64,..." (Base64 문자열)
        //   message: "3D 변환이 완료되었습니다."
        // }
        return response.data
    } catch (error) {
        console.error('3D 변환 오류:', error)
        throw error
    }
}

export default api

