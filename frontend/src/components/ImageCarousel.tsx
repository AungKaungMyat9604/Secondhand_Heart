import { useEffect, useRef } from 'react'
import { Carousel } from 'bootstrap'

export function ImageCarousel({
  id,
  images,
  alt,
  maxHeight = 420,
  rounded = false,
}: {
  id: string
  images: string[]
  alt: string
  maxHeight?: number
  rounded?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    if (images.length <= 1) return
    const instance = Carousel.getOrCreateInstance(ref.current, {
      interval: 3500,
      ride: 'carousel',
      pause: 'hover',
      touch: true,
    })
    instance.cycle()
    return () => instance.dispose()
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div
      ref={ref}
      id={id}
      className={`carousel slide carousel-fade carousel-dark ${rounded ? 'rounded overflow-hidden' : ''}`}
      data-bs-ride="carousel"
      data-bs-interval="3500"
      data-bs-pause="hover"
    >
      {images.length > 1 ? (
        <div className="carousel-indicators">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-bs-target={`#${id}`}
              data-bs-slide-to={idx}
              className={idx === 0 ? 'active' : ''}
              aria-current={idx === 0 ? 'true' : undefined}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      ) : null}

      <div className="carousel-inner">
        {images.map((src, idx) => (
          <div key={src} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
            <img src={src} alt={alt} className="d-block w-100" style={{ objectFit: 'cover', maxHeight }} />
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <button className="carousel-control-prev" type="button" data-bs-target={`#${id}`} data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target={`#${id}`} data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Next</span>
          </button>
        </>
      ) : null}
    </div>
  )
}

