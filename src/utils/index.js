/**
 * 自定义公共函数
 */
var myfn = {};

myfn.guid = function () {
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
  const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
 });
}


myfn.setRootFontSize = function (fontSize) {
 document.getElementsByTagName('html')[0].style['font-size'] = fontSize + 'px';
}

myfn.concatParams = function (params) {
 const tempParams = {}
 for (const key in params) {
  if (params[key] !== undefined) {
   tempParams[key] = params[key]
  }
 }
 const keys = Object.keys(tempParams)
 let paramStr = ''
 if (keys && keys.length > 0) {
  keys.forEach((item, index) => {
   if (index === 0) {
    paramStr += `?${item}=${params[item]}`
   } else {
    paramStr += `&${item}=${params[item]}`
   }
  })
 }
 return paramStr
}

myfn.replaceUrlImage = function (url) {
 if (!url) return ''
 // const config = useConfig()
 // if(config.canvas2ImageType === 'proxy') {
 //     if(url && url.indexOf('https://oss.vipchengyi.com/') === 0) {
 //         return '/oss-image' +  url.replace('https://oss.vipchengyi.com/', '/')
 //     }
 // }
 return url
}

myfn.clone = function (obj) {
 try {
  return JSON.parse(JSON.stringify(obj))
 } catch (err) {
  return {}
 }
}

myfn.upload = function (options, callback) {
 const { accept, multiple } = options
 const input = document.createElement("input")
 input.accept = accept
 input.type = "file"
 input.multiple = multiple
 input.onchange = function () {

  const tempFiles = []
  const failFiles = []
  for (let i = 0; i < input.files.length; i++) {
   const item = input.files[i]
   if (/^image\/[a-zA-Z]+$/.test(item.type)) {
    tempFiles.push(item)
   } else {
    failFiles.push(item)
   }
  }
  if (typeof callback === "function") {
   callback(tempFiles, failFiles)
  }
 }
 input.click()
}

myfn.getQueryString = function (url, name) {
 if (!url || !name) return null
 var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
 var r = url.match(reg);
 if (r != null) return unescape(r[2]);
 return null;
}


let menu_container
/**
 *
 * @param {*} x 左x位置
 * @param {*} y 上y位置
 * @param {*} menu_items 菜单详情
 */
myfn.createRightMenu = function (x, y, menu_items) {
 if (menu_container) {
  document.body.removeChild(menu_container)
 }
 menu_container = document.createElement("div")
 document.body.appendChild(menu_container)
 menu_container.classList && menu_container.classList.add("custom_menu_div")
 menu_container.style.left = x + 'px'
 menu_container.style.top = y + 'px'
 menu_container.style.zIndex = 999999

 let menu_ul = document.createElement("ul")
 menu_container.appendChild(menu_ul)

 if (Array.isArray(menu_items)) {
  menu_items.forEach((item,) => {
   const menu_lis = document.createElement("li")
   const icontainer = document.createElement("div")
   icontainer.classList && icontainer.classList.add("menu-i-div")
   const idom = document.createElement("i")
   if(item.icon_class) idom.classList.add(item.icon_class)
   icontainer.appendChild(idom)
   const divdom = document.createElement("div")
   divdom.classList && divdom.classList.add("menu-text-div")
   menu_lis.appendChild(icontainer)
   menu_lis.appendChild(divdom)

   menu_ul.appendChild(menu_lis)
   divdom.innerText = item.text
   menu_lis.onclick = (ev) => {
    ev.stopPropagation()
    ev.preventDefault()
    if (typeof item.click === 'function') {
     item.click(item,)

     if (menu_container) {
      document.body.removeChild(menu_container)
      menu_container = null
      document.onclick = null
     }
    }
   }
  })


 }

 if (document.onclick) document.onclick = null
 document.onclick = ev => {
  if (menu_container) {
   const { clientX, clientY } = ev
   const { top, bottom, left, right } = menu_container.getBoundingClientRect()
   if (left < clientX && right > clientX && top < clientY && bottom > clientY) {
console.log(left)
   } else {
    document.body.removeChild(menu_container)
    menu_container = null

    document.onclick = null
   }
  }

 }

}

export default myfn;
