// index.ts
import movieData from '../../utils/movie.data'

// 将 10 分制评分转换为 5 颗星数组
// 返回值例如: ['full', 'full', 'full', 'haf', 'empty']
// 文件名: full-star.svg, haf-star.svg, empty-star.svg
function computeStars(rate: number): string[] {
  const starRating = rate / 2
  const fullCount = Math.floor(starRating)
  const hasHalf = (starRating - fullCount) >= 0.5
  const emptyCount = 5 - fullCount - (hasHalf ? 1 : 0)

  const stars: string[] = []
  for (let i = 0; i < fullCount; i++) stars.push('full')
  if (hasHalf) stars.push('haf')
  for (let i = 0; i < emptyCount; i++) stars.push('empty')
  return stars
}

Component({
  data: {
    movies: [] as any[],
    featuredMovie: null as any,
  },
  lifetimes: {
    attached() {
      const movies = movieData.map((movie: any) => ({
        ...movie,
        stars: computeStars(movie.rate),
      }))
      this.setData({
        movies,
        featuredMovie: movies[0] || null,
      })
    },
  },
  methods: {
    onTapMovie(e: any) {
      console.log('onTapMovie triggered', e)
      const name = e.currentTarget.dataset.name
      console.log('Movie name:', name)
      if (name) {
        wx.navigateTo({
          url: `/pages/chat/chat?name=${name}`,
          success: () => console.log('Navigation success'),
          fail: (err) => {
            console.error('Navigation failed', err)
            wx.showModal({
              title: 'Navigation Failed',
              content: JSON.stringify(err),
            })
          }
        })
      } else {
        console.error('No name found in dataset')
      }
    },
  },
})
