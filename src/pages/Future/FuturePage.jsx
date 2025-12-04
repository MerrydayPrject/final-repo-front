import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import Lottie from 'lottie-react'
import './FuturePage.css'

gsap.registerPlugin(ScrollTrigger)

const FuturePage = ({ onBackToMain }) => {
    const visionRef = useRef(null)
    const fullImgRef = useRef(null)
    const bgRef = useRef(null)
    const topTxtRef = useRef(null)
    const btmTxtRef = useRef(null)
    const canvasRef = useRef(null)
    const sceneRef = useRef(null)
    const modelRef = useRef(null)
    const mixerRef = useRef(null)
    const animationIdRef = useRef(null)
    const rendererRef = useRef(null)
    const cameraRef = useRef(null)
    const controlsEnabledRef = useRef(false)
    const isDraggingRef = useRef(false)
    const previousMousePositionRef = useRef({ x: 0, y: 0 })
    const defaultCameraZRef = useRef(1) // 기본 카메라 Z 위치 저장
    const instructionRef = useRef(null)
    const scrollDownIconRef = useRef(null)
    const [scrollDownAnimation, setScrollDownAnimation] = useState(null)
    const [isModelLoaded, setIsModelLoaded] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // 씬 생성
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x111111)
        sceneRef.current = scene

        // 스튜디오 조명 설정 (밝게)
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
        hemisphereLight.position.set(0, 4, 0)
        scene.add(hemisphereLight)

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        scene.add(ambientLight)

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5)
        directionalLight1.position.set(1.5, 5, 2)
        directionalLight1.castShadow = true
        directionalLight1.shadow.mapSize.width = 4096
        directionalLight1.shadow.mapSize.height = 4096
        directionalLight1.shadow.camera.near = 0.5
        directionalLight1.shadow.camera.far = 50
        directionalLight1.shadow.radius = 8
        scene.add(directionalLight1)

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight2.position.set(0, 3, 3)
        directionalLight2.castShadow = true
        directionalLight2.shadow.mapSize.width = 4096
        directionalLight2.shadow.mapSize.height = 4096
        directionalLight2.shadow.radius = 8
        scene.add(directionalLight2)

        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6)
        directionalLight3.position.set(-2, 3, -2)
        scene.add(directionalLight3)

        const pointLight1 = new THREE.PointLight(0xffffff, 1.0, 10)
        pointLight1.position.set(2, 2, 1)
        scene.add(pointLight1)

        const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 10)
        pointLight2.position.set(-2, 2, 1)
        scene.add(pointLight2)

        // 피팅룸 공간 구성
        const floorGeometry = new THREE.PlaneGeometry(6, 6)
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 1.0,
            metalness: 0.0
        })
        const floor = new THREE.Mesh(floorGeometry, floorMaterial)
        floor.rotation.x = -Math.PI / 2
        floor.position.set(0, 0, -1.0)
        floor.receiveShadow = true
        scene.add(floor)

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x2b2b2b,
            roughness: 1.0,
            metalness: 0.0
        })
        const sideWallGeometry = new THREE.PlaneGeometry(6, 4)

        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial)
        leftWall.position.set(-1.8, 2, -1.0)
        leftWall.rotation.y = Math.PI / 6
        scene.add(leftWall)

        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial)
        rightWall.position.set(1.8, 2, -1.0)
        rightWall.rotation.y = -Math.PI / 6
        scene.add(rightWall)

        const backWallGeometry = new THREE.PlaneGeometry(4, 4.5)
        const backWallMaterial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 1.0,
            metalness: 0.0
        })
        const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial)
        backWall.position.set(0, 2, -2.5)
        scene.add(backWall)

        const mirrorGeometry = new THREE.PlaneGeometry(1.4, 3.0)
        const mirrorMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.3,
            metalness: 0.0
        })
        const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial)
        mirror.position.set(0.9, 2.0, -2.49)
        scene.add(mirror)

        // HDRI 환경 맵 설정
        const rgbeLoader = new RGBELoader()
        if (rgbeLoader) {
            // 웹버전에서 더 높은 해상도의 HDRI 사용
            const isMobile = window.innerWidth <= 768
            const hdriUrl = isMobile
                ? 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr'
                : 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/studio_small_09_4k.hdr'

            rgbeLoader.load(
                hdriUrl,
                (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping
                    texture.minFilter = THREE.LinearFilter
                    texture.magFilter = THREE.LinearFilter
                    texture.generateMipmaps = false
                    scene.environment = texture
                    scene.environmentIntensity = 2.0
                    scene.background = new THREE.Color(0x111111)
                },
                undefined,
                (error) => {
                    console.warn('HDRI 로드 실패, 기본 라이팅 사용:', error)
                }
            )
        }

        // 카메라 설정
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const defaultZ = 1
        camera.position.set(0, 1, defaultZ)
        defaultCameraZRef.current = defaultZ // 기본 Z 위치 저장
        cameraRef.current = camera

        // 렌더러 설정
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.5,
            powerPreference: 'high-performance'
        })
        renderer.setSize(width, height)
        // 최고 화질을 위해 pixelRatio를 최대 3까지 설정
        const pixelRatio = Math.min(window.devicePixelRatio, 3)
        renderer.setPixelRatio(pixelRatio)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.shadowMap.autoUpdate = true
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.physicallyCorrectLights = true
        rendererRef.current = renderer

        // GLTF 모델 로드
        const loader = new GLTFLoader()
        const clock = new THREE.Clock()

        loader.load(
            '/3D/scene.gltf',
            (gltf) => {
                const model = gltf.scene
                model.scale.set(0.8, 0.8, 0.8)  // 크기 축소
                model.position.set(0, 0.35, -0.8)  // 뒤로 이동 (Z축 값 증가)
                modelRef.current = model

                // 머티리얼 보정
                const layerColors = {
                    'Dress_Layer_1': 0xF0F0F0,
                    'Dress_Layer_2': 0xE8E8E8,
                    'Dress_Layer_5': 0xE8E8E8,
                    'Dress_Layer_6': 0xE8E8E8,
                    'Flowers': 0xFFDEE1,
                    'default': 0xF0F0F0
                }

                const areaColors = {
                    cape: 0xFAFAFA,
                    waist: 0xFAFAFA
                }

                const capeMeshes = ['Object_10', 'Object_12']
                const disableTextureLayers = ['Dress_Layer_5', 'Dress_Layer_6']

                model.traverse((obj) => {
                    if (obj.isMesh) {
                        obj.castShadow = true
                        obj.receiveShadow = true

                        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]

                        materials.forEach((mat) => {
                            if (!mat) return

                            // 텍스처 필터링 개선
                            const setTextureFiltering = (texture) => {
                                if (texture && rendererRef.current) {
                                    texture.minFilter = THREE.LinearMipmapLinearFilter
                                    texture.magFilter = THREE.LinearFilter
                                    texture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy()
                                    texture.generateMipmaps = true
                                }
                            }

                            if (mat.map) {
                                mat.map.colorSpace = THREE.SRGBColorSpace
                                setTextureFiltering(mat.map)
                            }

                            if (mat.emissiveMap) {
                                mat.emissiveMap.colorSpace = THREE.SRGBColorSpace
                                setTextureFiltering(mat.emissiveMap)
                            }

                            if (mat.normalMap) {
                                mat.normalMap.colorSpace = THREE.NoColorSpace
                                setTextureFiltering(mat.normalMap)
                            }

                            // 다른 텍스처 맵들도 필터링 개선
                            if (mat.roughnessMap) setTextureFiltering(mat.roughnessMap)
                            if (mat.metalnessMap) setTextureFiltering(mat.metalnessMap)
                            if (mat.aoMap) setTextureFiltering(mat.aoMap)
                            if (mat.bumpMap) setTextureFiltering(mat.bumpMap)

                            const materialName = mat.name || ''
                            const meshName = obj.name || ''

                            const isLayer5 = materialName.includes('Dress_Layer_5')
                            const isLayer6 = materialName.includes('Dress_Layer_6')

                            const isCape =
                                (isLayer5 || isLayer6) &&
                                capeMeshes.includes(meshName)

                            const waistMeshCandidates = ['Object_4', 'Object_8']
                            const isWaist =
                                waistMeshCandidates.includes(meshName) &&
                                !isCape

                            let layerColor = layerColors.default
                            let shouldDisableTexture = false

                            if (isCape) {
                                layerColor = areaColors.cape
                                shouldDisableTexture = true
                            } else if (isWaist) {
                                layerColor = areaColors.waist
                                shouldDisableTexture = true
                            } else {
                                for (const layerName in layerColors) {
                                    if (layerName !== 'default' && materialName.includes(layerName)) {
                                        layerColor = layerColors[layerName]
                                        if (disableTextureLayers.includes(layerName)) {
                                            shouldDisableTexture = true
                                        }
                                        break
                                    }
                                }
                            }

                            if (shouldDisableTexture) {
                                if (mat.map) {
                                    mat.map = null
                                }
                                mat.alphaMap = null
                                mat.aoMap = null
                                mat.bumpMap = null
                                mat.displacementMap = null
                                mat.emissiveMap = null
                                mat.lightMap = null
                                mat.metalnessMap = null
                                mat.normalMap = null
                                mat.roughnessMap = null

                                if (mat.color) {
                                    mat.color.setHex(layerColor)
                                }

                                mat.needsUpdate = true
                            } else {
                                if (mat.color) {
                                    mat.color.setHex(layerColor)
                                }
                            }

                            if (mat.roughness !== undefined) {
                                mat.roughness = 1.0
                            }

                            if (mat.metalness !== undefined) {
                                mat.metalness = 0.0
                            }

                            if (mat.envMapIntensity !== undefined) {
                                mat.envMapIntensity = 0.0
                            }

                            if (mat.specular !== undefined) {
                                mat.specular.set(0x000000)
                            }

                            if (mat.glossiness !== undefined) {
                                mat.glossiness = 0.0
                            }

                            if ('clearcoat' in mat) {
                                mat.clearcoat = 0.0
                            }

                            if ('sheen' in mat) {
                                mat.sheen = 0.0
                            }
                        })
                    }
                })

                scene.add(model)

                // 단상 추가
                const pedestalGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32)
                const pedestalMaterial = new THREE.MeshStandardMaterial({
                    color: 0xF0F0E8,
                    roughness: 0.8,
                    metalness: 0.0
                })
                const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
                pedestal.position.set(0, 0.35 - 0.15, -0.8)  // 드레스와 함께 뒤로 이동
                pedestal.receiveShadow = true
                pedestal.castShadow = true
                scene.add(pedestal)

                // 애니메이션 설정
                if (gltf.animations && gltf.animations.length) {
                    const mixer = new THREE.AnimationMixer(model)
                    gltf.animations.forEach((clip) => {
                        mixer.clipAction(clip).play()
                    })
                    mixerRef.current = mixer
                }

                // 모델이 정상적으로 로드되면 로딩 상태 해제
                setIsModelLoaded(true)

                // 모델 로드 후 자동회전은 즉시 시작됨 (애니메이션 루프에서 처리)
                // 드래그 컨트롤은 ScrollTrigger 완료 후 활성화되지만,
                // 모델이 로드된 후 일정 시간이 지나면 자동으로 활성화 (안전장치)
                const isMobile = window.innerWidth <= 768

                // 모바일에서는 즉시 활성화, 웹버전은 ScrollTrigger 대기
                if (isMobile) {
                    // 모바일에서는 즉시 활성화
                    if (modelRef.current) {
                        controlsEnabledRef.current = true
                    }
                } else {
                    // 웹버전은 기존 로직 유지
                    setTimeout(() => {
                        if (modelRef.current && !controlsEnabledRef.current) {
                            // ScrollTrigger가 아직 완료되지 않았어도 모델이 로드되었으면 컨트롤 활성화
                            // (사용자가 스크롤하지 않고 바로 드래그할 수 있도록)
                            const allTriggers = ScrollTrigger.getAll()
                            const bgTrigger = allTriggers.find(trigger => {
                                try {
                                    return trigger.vars &&
                                        (trigger.vars.trigger === fullImgRef.current ||
                                            trigger.trigger === fullImgRef.current)
                                } catch (e) {
                                    return false
                                }
                            })

                            // ScrollTrigger가 없거나 progress가 0.95 이상이면 활성화
                            if (!bgTrigger || (bgTrigger.progress && bgTrigger.progress >= 0.95)) {
                                controlsEnabledRef.current = true
                            }
                        }
                    }, 500) // 0.5초 후 안전장치로 활성화
                }
            },
            undefined,
            (error) => {
                console.error('모델 로드 오류:', error)
                // 오류가 나더라도 로딩 상태는 해제
                setIsModelLoaded(true)
            }
        )

        // 리사이즈 핸들러
        const handleResize = () => {
            const newWidth = canvas.clientWidth
            const newHeight = canvas.clientHeight
            if (cameraRef.current) {
                cameraRef.current.aspect = newWidth / newHeight
                cameraRef.current.updateProjectionMatrix()
            }
            if (rendererRef.current) {
                rendererRef.current.setSize(newWidth, newHeight)
                // 리사이즈 시에도 pixelRatio 유지 (최대 3)
                const pixelRatio = Math.min(window.devicePixelRatio, 3)
                rendererRef.current.setPixelRatio(pixelRatio)
            }
        }
        window.addEventListener('resize', handleResize)

        // 마우스 컨트롤 (스크롤 애니메이션 완료 후 활성화)
        const handleMouseEnter = () => {
            if (controlsEnabledRef.current && !isDraggingRef.current) {
                canvas.style.cursor = 'grab'
            }
        }

        const handleMouseLeave = () => {
            if (!isDraggingRef.current) {
                canvas.style.cursor = 'default'
            }
        }

        const handleMouseDown = (e) => {
            if (!controlsEnabledRef.current) return
            isDraggingRef.current = true
            previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
            canvas.style.cursor = 'grabbing'
        }

        const handleMouseMove = (e) => {
            if (!controlsEnabledRef.current || !isDraggingRef.current || !modelRef.current) return
            e.preventDefault()
            const deltaX = e.clientX - previousMousePositionRef.current.x
            modelRef.current.rotation.y += deltaX * 0.01
            previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseUp = (e) => {
            if (!controlsEnabledRef.current) return
            isDraggingRef.current = false
            // 호버 상태에 따라 커서 설정
            if (canvas.matches(':hover')) {
                canvas.style.cursor = 'grab'
            } else {
                canvas.style.cursor = 'default'
            }
        }

        const handleWheel = (e) => {
            if (!controlsEnabledRef.current || !cameraRef.current) return
            e.preventDefault()
            const zoomSpeed = 0.05
            const defaultZ = defaultCameraZRef.current // 저장된 기본 Z 위치 (1)
            const currentZ = cameraRef.current.position.z
            // e.deltaY > 0: 휠 다운 (축소, Z 증가) / e.deltaY < 0: 휠 업 (확대, Z 감소)
            const newZ = currentZ + e.deltaY * zoomSpeed

            // 기본값(defaultZ)보다 커지지 않도록 (기본 크기 이상으로 축소 방지)
            // 최소값은 0.5로 제한 (확대 제한)
            // Z값이 클수록 멀어지므로(축소), 기본값보다 커지면 안 됨
            cameraRef.current.position.z = Math.max(0.5, Math.min(defaultZ, newZ))
        }

        // 터치 이벤트 핸들러 (모바일용)
        const handleTouchStart = (e) => {
            if (!controlsEnabledRef.current) return
            e.preventDefault()
            isDraggingRef.current = true
            const touch = e.touches[0]
            previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY }
        }

        const handleTouchMove = (e) => {
            if (!controlsEnabledRef.current || !isDraggingRef.current || !modelRef.current) return
            e.preventDefault()
            const touch = e.touches[0]
            const deltaX = touch.clientX - previousMousePositionRef.current.x
            modelRef.current.rotation.y += deltaX * 0.01
            previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY }
        }

        const handleTouchEnd = (e) => {
            if (!controlsEnabledRef.current) return
            e.preventDefault()
            isDraggingRef.current = false
        }

        // 마우스 이벤트 (웹버전)
        canvas.addEventListener('mouseenter', handleMouseEnter)
        canvas.addEventListener('mouseleave', handleMouseLeave)
        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('wheel', handleWheel)

        // 터치 이벤트 (모바일)
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
        canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false })

        canvas.style.cursor = 'default'

        // 애니메이션 루프
        let isAnimating = true
        const animate = () => {
            if (!isAnimating) return

            animationIdRef.current = requestAnimationFrame(animate)

            if (mixerRef.current) {
                mixerRef.current.update(clock.getDelta())
            }

            // 모델이 로드되었고 드래그 중이 아닐 때 무조건 천천히 자동 회전
            // controlsEnabledRef와 관계없이 모델이 있으면 회전
            if (modelRef.current && !isDraggingRef.current) {
                // 모델이 씬에 있는지 확인
                if (sceneRef.current && sceneRef.current.children.includes(modelRef.current)) {
                    modelRef.current.rotation.y += 0.003
                }
            }

            if (rendererRef.current && cameraRef.current && sceneRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current)
            }
        }
        animate()

        // 클린업
        return () => {
            isAnimating = false

            window.removeEventListener('resize', handleResize)
            if (canvas) {
                canvas.removeEventListener('mouseenter', handleMouseEnter)
                canvas.removeEventListener('mouseleave', handleMouseLeave)
                canvas.removeEventListener('mousedown', handleMouseDown)
                canvas.removeEventListener('wheel', handleWheel)
                // 터치 이벤트 제거 (모바일)
                canvas.removeEventListener('touchstart', handleTouchStart)
                canvas.removeEventListener('touchmove', handleTouchMove)
                canvas.removeEventListener('touchend', handleTouchEnd)
                canvas.removeEventListener('touchcancel', handleTouchEnd)
                canvas.style.cursor = ''
            }
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)

            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
                animationIdRef.current = null
            }

            // Three.js 리소스 정리 (ref를 null로 설정하기 전에)
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose()
                    }
                    if (object.material) {
                        const materials = Array.isArray(object.material) ? object.material : [object.material]
                        materials.forEach((material) => {
                            if (material.map) material.map.dispose()
                            if (material.normalMap) material.normalMap.dispose()
                            material.dispose()
                        })
                    }
                })
            }

            // Three.js renderer cleanup
            // 주의: canvas는 React가 관리하는 DOM이므로 직접 제거하지 않음
            // React가 자동으로 제거해주므로 dispose()만 호출
            if (rendererRef.current) {
                try {
                    rendererRef.current.dispose()
                } catch (e) {
                    // ignore dispose errors
                }
            }

            // ref 초기화 (dispose 후에)
            controlsEnabledRef.current = false
            isDraggingRef.current = false
            modelRef.current = null
            mixerRef.current = null
            sceneRef.current = null
            rendererRef.current = null
            cameraRef.current = null
        }
    }, [])

    // 페이지 마운트 시 스크롤을 맨 위로 리셋 및 상태 초기화
    useEffect(() => {
        // 상태 완전 초기화
        setIsModelLoaded(false)
        controlsEnabledRef.current = false
        isDraggingRef.current = false
        previousMousePositionRef.current = { x: 0, y: 0 }

        // ref는 useEffect의 클린업에서 처리하므로 여기서는 초기화하지 않음
        // (씬과 렌더러는 useEffect에서 새로 생성됨)

        window.scrollTo(0, 0)
        // ScrollTrigger도 리셋
        ScrollTrigger.refresh()
    }, [])

    // 마우스 스크롤 다운 아이콘 애니메이션 로드
    useEffect(() => {
        fetch('/3D/Mouse scroll down.json')
            .then(response => response.json())
            .then(data => setScrollDownAnimation(data))
            .catch(error => console.error('마우스 스크롤 아이콘 로드 실패:', error))
    }, [])

    // GSAP ScrollTrigger 애니메이션
    // useLayoutEffect를 사용하여 React의 DOM 제거보다 먼저 cleanup 실행
    useLayoutEffect(() => {
        const scrollTriggers = []
        const gsapAnimations = []
        let timer = null
        let isMounted = true

        // 리사이즈 핸들러
        const handleResize = () => {
            if (isMounted) {
                ScrollTrigger.refresh();
            }
        };

        // DOM이 렌더링된 후 실행
        timer = setTimeout(() => {
            // 초기 스크롤 다운 아이콘 표시
            if (scrollDownIconRef.current && !controlsEnabledRef.current) {
                scrollDownIconRef.current.style.display = 'block'
                const iconAnimation = gsap.fromTo(scrollDownIconRef.current,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.5, delay: 0.5 }
                )
                gsapAnimations.push(iconAnimation)
            }
            // ScrollTrigger 새로고침
            ScrollTrigger.refresh();

            // ref를 사용해서 DOM 요소에 직접 접근
            // ScrollTrigger의 pin은 DOM에 wrapper를 추가하므로 주의 필요
            if (visionRef.current && fullImgRef.current && isMounted) {
                // 부모 노드가 존재하는지 확인
                if (visionRef.current.parentNode && fullImgRef.current.parentNode) {
                    const pinAnimation = gsap.to(fullImgRef.current, {
                        scrollTrigger: {
                            trigger: visionRef.current,
                            pin: true,
                            scrub: 0.5,
                            start: "top top",
                            end: "bottom bottom",
                            pinSpacing: false,
                            invalidateOnRefresh: true,
                            anticipatePin: 1,
                            markers: false
                        }
                    });
                    if (pinAnimation && pinAnimation.scrollTrigger) {
                        scrollTriggers.push(pinAnimation.scrollTrigger);
                        gsapAnimations.push(pinAnimation);
                    }
                }
            }

            // 3D 뷰어 확대 및 clip-path 애니메이션
            if (bgRef.current && fullImgRef.current && isMounted) {
                const bgAnimation = gsap.to(bgRef.current, {
                    clipPath: "inset(0% 0% 0% 0%)",
                    scale: 1.3,
                    scrollTrigger: {
                        trigger: fullImgRef.current,
                        start: "top top",
                        end: "+=1000",
                        scrub: 0.5,
                        onEnter: () => {
                            // 스크롤이 시작될 때 모델이 이미 로드되어 있으면 컨트롤 활성화
                            const isMobile = window.innerWidth <= 768
                            if (modelRef.current) {
                                // 모바일에서는 즉시 활성화, 웹버전도 활성화
                                controlsEnabledRef.current = true
                            }
                        },
                        onComplete: () => {
                            // 애니메이션 완료 시 컨트롤 활성화 (강제로 활성화)
                            const isMobile = window.innerWidth <= 768
                            if (modelRef.current) {
                                // 모바일과 웹버전 모두 활성화
                                controlsEnabledRef.current = true
                            }

                            // 안내 문구 표시
                            if (instructionRef.current) {
                                instructionRef.current.style.display = 'block'
                                gsap.fromTo(instructionRef.current,
                                    { opacity: 0 },
                                    { opacity: 1, duration: 0.3 }
                                )
                            }
                            // 스크롤 다운 아이콘 숨김
                            if (scrollDownIconRef.current) {
                                gsap.killTweensOf(scrollDownIconRef.current)
                                gsap.to(scrollDownIconRef.current, {
                                    opacity: 0,
                                    y: 10,
                                    duration: 0.3,
                                    onComplete: () => {
                                        if (scrollDownIconRef.current) {
                                            scrollDownIconRef.current.style.display = 'none'
                                        }
                                    }
                                })
                            }
                        },
                        onUpdate: (self) => {
                            // 스크롤이 끝에 도달했을 때 (progress >= 0.98로 더 엄격하게)
                            const isMobile = window.innerWidth <= 768
                            // 모바일에서는 progress가 0.5 이상이면 활성화, 웹버전은 0.98 이상
                            const threshold = isMobile ? 0.5 : 0.98
                            if (self.progress >= threshold) {
                                // 컨트롤 강제 활성화 (모델이 로드되었는지 확인)
                                if (modelRef.current) {
                                    controlsEnabledRef.current = true
                                }

                                // 안내 문구 강제 표시
                                if (instructionRef.current) {
                                    instructionRef.current.style.display = 'block'
                                    gsap.killTweensOf(instructionRef.current)
                                    gsap.to(instructionRef.current, { opacity: 1, duration: 0.2, clearProps: 'none' })
                                }

                                // 스크롤 다운 아이콘 강제 숨김
                                if (scrollDownIconRef.current) {
                                    gsap.killTweensOf(scrollDownIconRef.current)
                                    gsap.to(scrollDownIconRef.current, {
                                        opacity: 0,
                                        y: 10,
                                        duration: 0.2,
                                        onComplete: () => {
                                            if (scrollDownIconRef.current) {
                                                scrollDownIconRef.current.style.display = 'none'
                                            }
                                        }
                                    })
                                }
                            } else {
                                // 스크롤 진행 중일 때 (progress < 0.98)
                                // 컨트롤 비활성화 (스크롤이 끝까지 내려가지 않았으면 비활성화)
                                controlsEnabledRef.current = false

                                // 안내 문구 숨김
                                if (instructionRef.current) {
                                    gsap.killTweensOf(instructionRef.current)
                                    gsap.to(instructionRef.current, {
                                        opacity: 0,
                                        duration: 0.2,
                                        onComplete: () => {
                                            if (instructionRef.current) {
                                                instructionRef.current.style.display = 'none'
                                            }
                                        }
                                    })
                                }

                                // 스크롤 다운 아이콘 표시
                                if (scrollDownIconRef.current) {
                                    if (scrollDownIconRef.current.style.display === 'none') {
                                        scrollDownIconRef.current.style.display = 'block'
                                    }
                                    gsap.killTweensOf(scrollDownIconRef.current)
                                    gsap.to(scrollDownIconRef.current, { opacity: 1, y: 0, duration: 0.2 })
                                }
                            }
                        },
                        onReverseComplete: () => {
                            // 스크롤을 맨 위로 올렸을 때 초기 상태로 복원 (모바일 고려)
                            const isMobile = window.innerWidth <= 768
                            const isSmallMobile = window.innerWidth <= 480
                            // 모바일에서는 top_txt는 조금만 오른쪽(양수), btm_txt는 오른쪽(양수)
                            const topInitialX = isSmallMobile ? 15 : isMobile ? 20 : -350
                            const btmInitialX = isSmallMobile ? 15 : isMobile ? 20 : 350

                            if (topTxtRef.current) {
                                gsap.killTweensOf(topTxtRef.current)
                                gsap.set(topTxtRef.current, { x: topInitialX, opacity: 1, clearProps: 'none' })
                            }
                            if (btmTxtRef.current) {
                                gsap.killTweensOf(btmTxtRef.current)
                                gsap.set(btmTxtRef.current, { x: btmInitialX, opacity: 1, clearProps: 'none' })
                            }
                        }
                    }
                });
                if (bgAnimation.scrollTrigger) {
                    scrollTriggers.push(bgAnimation.scrollTrigger);
                }
                gsapAnimations.push(bgAnimation);
            }

            // 위쪽 텍스트가 왼쪽으로 사라지게
            if (topTxtRef.current && fullImgRef.current && isMounted) {
                // 화면 크기에 따라 초기 위치 설정
                const isMobile = window.innerWidth <= 768
                const isSmallMobile = window.innerWidth <= 480
                // 모바일에서는 조금만 오른쪽으로 이동 (양수), 웹버전은 왼쪽으로 (음수)
                const initialX = isSmallMobile ? 15 : isMobile ? 20 : -350
                const endX = isSmallMobile ? -600 : isMobile ? -800 : -1200

                // 기존 애니메이션 제거
                gsap.killTweensOf(topTxtRef.current)

                // 모바일에서도 작동하도록 명시적으로 설정
                if (topTxtRef.current.style) {
                    topTxtRef.current.style.willChange = 'transform'
                }

                gsap.set(topTxtRef.current, {
                    x: initialX,
                    opacity: 1,
                    force3D: true,
                    immediateRender: true
                })

                const topTxtAnimation = gsap.to(topTxtRef.current, {
                    x: endX, // 화면 크기에 따라 다른 값
                    opacity: 0,
                    force3D: true,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: fullImgRef.current,
                        start: "top top",
                        end: "+=1000",
                        scrub: 1,
                        invalidateOnRefresh: true,
                        refreshPriority: -1,
                        onUpdate: (self) => {
                            // 모바일에서도 애니메이션이 작동하는지 확인
                            if (topTxtRef.current && self.progress > 0) {
                                topTxtRef.current.style.willChange = 'transform'
                            }
                        }
                    }
                });
                if (topTxtAnimation.scrollTrigger) {
                    scrollTriggers.push(topTxtAnimation.scrollTrigger);
                }
                gsapAnimations.push(topTxtAnimation);
            }

            // 아래쪽 텍스트가 오른쪽으로 사라지게
            if (btmTxtRef.current && fullImgRef.current && isMounted) {
                // 화면 크기에 따라 초기 위치 설정
                const isMobile = window.innerWidth <= 768
                const isSmallMobile = window.innerWidth <= 480
                // 모바일에서는 오른쪽으로 이동 (양수), 웹버전은 오른쪽으로 (양수)
                const initialX = isSmallMobile ? 15 : isMobile ? 20 : 350
                const endX = isSmallMobile ? 600 : isMobile ? 800 : 1200

                // 기존 애니메이션 제거
                gsap.killTweensOf(btmTxtRef.current)

                // 모바일에서도 작동하도록 명시적으로 설정
                if (btmTxtRef.current.style) {
                    btmTxtRef.current.style.willChange = 'transform'
                }

                gsap.set(btmTxtRef.current, {
                    x: initialX,
                    opacity: 1,
                    force3D: true,
                    immediateRender: true
                })

                const btmTxtAnimation = gsap.to(btmTxtRef.current, {
                    x: endX, // 화면 크기에 따라 다른 값
                    opacity: 0,
                    force3D: true,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: fullImgRef.current,
                        start: "top top",
                        end: "+=1000",
                        scrub: 1,
                        invalidateOnRefresh: true,
                        refreshPriority: -1,
                        onUpdate: (self) => {
                            // 모바일에서도 애니메이션이 작동하는지 확인
                            if (btmTxtRef.current && self.progress > 0) {
                                btmTxtRef.current.style.willChange = 'transform'
                            }
                        }
                    }
                });
                if (btmTxtAnimation.scrollTrigger) {
                    scrollTriggers.push(btmTxtAnimation.scrollTrigger);
                }
                gsapAnimations.push(btmTxtAnimation);
            }

            // 리사이즈 시 ScrollTrigger 새로고침
            window.addEventListener('resize', handleResize);
        }, 100);

        return () => {
            // 컴포넌트가 언마운트되었음을 표시
            isMounted = false;

            if (timer) {
                clearTimeout(timer);
            }

            // 리사이즈 이벤트 리스너 제거
            window.removeEventListener('resize', handleResize);

            // ScrollTrigger를 먼저 정리 (pin 해제가 중요)
            // React가 DOM을 제거하기 전에 ScrollTrigger의 pin을 해제해야 함
            // 부모 노드 존재 여부를 확인한 후 안전하게 정리
            try {
                // ref가 여전히 유효하고 부모 노드가 존재하는지 확인
                const isRefValid = visionRef.current &&
                    fullImgRef.current &&
                    visionRef.current.parentNode &&
                    fullImgRef.current.parentNode;

                // 모든 ScrollTrigger를 역순으로 disable하고 kill (pin이 있는 것부터)
                for (let i = scrollTriggers.length - 1; i >= 0; i--) {
                    const trigger = scrollTriggers[i];
                    if (trigger) {
                        try {
                            // ref가 유효할 때만 disable (pin 해제)
                            if (isRefValid) {
                                if (typeof trigger.disable === 'function') {
                                    trigger.disable();
                                }
                            }
                            // kill로 완전히 제거 (항상 실행)
                            if (typeof trigger.kill === 'function') {
                                trigger.kill(true);
                            }
                        } catch (e) {
                            // ignore individual errors - 이미 제거되었을 수 있음
                        }
                    }
                }

                // 남은 모든 ScrollTrigger 정리
                try {
                    const allTriggers = ScrollTrigger.getAll();
                    for (let i = allTriggers.length - 1; i >= 0; i--) {
                        const trigger = allTriggers[i];
                        if (trigger) {
                            try {
                                // ref가 유효할 때만 disable
                                if (isRefValid) {
                                    if (typeof trigger.disable === 'function') {
                                        trigger.disable();
                                    }
                                }
                                // kill로 완전히 제거
                                if (typeof trigger.kill === 'function') {
                                    trigger.kill(true);
                                }
                            } catch (e) {
                                // ignore cleanup errors
                            }
                        }
                    }
                } catch (e) {
                    // ignore getAll errors
                }

                // ScrollTrigger 전체 정리
                try {
                    ScrollTrigger.clearScrollMemory();
                } catch (e) {
                    // ignore clearScrollMemory errors
                }
            } catch (e) {
                // ignore ScrollTrigger cleanup errors
            }

            // GSAP 애니메이션 kill
            gsapAnimations.forEach(anim => {
                try {
                    if (anim && typeof anim.kill === 'function') {
                        anim.kill();
                    }
                } catch (e) {
                    // ignore
                }
            });
        }
    }, [])

    return (
        <div id="vision1012" ref={visionRef}>
            <div className="full_img" ref={fullImgRef}>
                <div className={`bg ${!isModelLoaded ? 'bg-loading' : ''}`} ref={bgRef}>
                    <canvas ref={canvasRef} className="future-canvas" />
                </div>
                {!isModelLoaded && (
                    <div className="future-loading-overlay">
                        <div className="future-loading-inner">
                            <p className="future-loading-title">3D 드레스를 불러오는 중입니다</p>
                            <p className="future-loading-sub">잠시만 기다려 주세요...</p>
                        </div>
                    </div>
                )}
                <div className="b_txt">
                    <p className="top_txt" ref={topTxtRef}>웨딩드레스 <span>3D기능</span></p>
                    <p className="btm_txt" ref={btmTxtRef}><span>곧</span> 만나보세요</p>
                </div>
                <div className="instruction_txt" ref={instructionRef}>
                    <p>드래그하여 드레스를 둘러보세요</p>
                    <p className="sub">마우스 휠로 확대/축소 가능</p>
                </div>
                <div className="scroll_down_icon" ref={scrollDownIconRef}>
                    {scrollDownAnimation && (
                        <Lottie
                            animationData={scrollDownAnimation}
                            loop={true}
                            className="scroll-down-lottie"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default FuturePage
