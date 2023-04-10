import throttle from 'lodash/throttle'
export default {
 data () {
  return {
   downkeys: []
  }
 },
 mounted () {
  this.bindcv()
 },
 destroyed () {
  this.unbindcv()
 },
 methods: {
  /**
    * 绑定ctrl+x
    */
  bindcv () {
   document.body.addEventListener('keydown', this.cv_func);
  },
  unbindcv () {
   document.body.removeEventListener('keydown', this.cv_func)
  },
  cv_func: throttle(function (event) {
   // console.log('keydown', event)
   if (!this.downkeys.includes(event.keyCode)) {
    this.downkeys.push(event.keyCode)
   }
   // if (event.keyCode === 17) {
   //  // ctrl
   // }
   // if (event.keyCode === 67) {
   //  // c
   // }
   // if (event.keyCode === 88) {
   //  // x
   // }
   // if (event.keyCode === 86) {
   //  // v
   // }

// console.log(this.downkeys)
   if (this.downkeys.includes(17)) {
    if (this.downkeys.includes(67) && this.downkeys.includes(88)) {
     const cIndex = thid.downkeys.findIndex(item => item === 67)
     const xIndex = thid.downkeys.findIndex(item => item === 88)
     if (cIndex > xIndex) {
      // ctrl + c function
     } else {
      if (typeof this.shear === 'function') {
       this.shear()
      }
     }
    } else if (this.downkeys.includes(67)) {
     // ctrl + c function
    } else if (this.downkeys.includes(88)) {
     // ctrl + x function
     if (typeof this.shear === 'function') {
      this.shear()
     }
    }
    if (this.downkeys.includes(86)) {
     // ctrl + v function
     if (typeof this.pasteHere === 'function') {
      this.pasteHere()
     }
    }
   }

   // 如果未触发，那么就初始化按键
   if (this.timer) clearTimeout(this.timer)
   this.timer = setTimeout(() => {
    this.downkeys = []
   }, 500)
  }, 200),
 }
}
