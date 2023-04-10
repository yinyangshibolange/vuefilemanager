import utils from "../../utils"
import { MockStore } from "../MockStore.js"

function readFile (file) {
 console.log(file)
 return new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = async function (res) {
   resolve(reader.result)
  }
  reader.readAsDataURL(file)
 })
}

export default (Mock) => {
 // 文件上传
 Mock.mock("/api/upload", 'post', (req) => {
  return new Promise((resolve, reject) => {
   const file = req.body.get("file")
   const parentid = req.body.get("parentid")
   const name = file.name
   const reader = new FileReader()
   reader.onload = async function (res) {
    await MockStore.addItem("imageList", {
     id: utils.guid(),
     url: reader.result,
     name: name,
     parentid: parentid || "",
    })
    resolve({
     code: 0,
     msg: '成功'
    })
   }
   reader.readAsDataURL(file)
  })
 })

 // 批量文件上传
 // Mock.mock("/api/uploadbatch", 'post', async (req) => {
 //  const files = req.body.get("files")
 //  const parentid = req.body.get("parentid")


 //  if (!files || files.length === 0) {
 //   return {
 //    code: -1,
 //    msg: "参数错误"
 //   }
 //  }

 //  const templist = []
 //  for (let i = 0; i < files.length; i++) {
 //   const fileurl = await readFile(files[i])
 //   templist.push({
 //    id: utils.guid(),
 //    url: fileurl,
 //    name: files[i].name,
 //    parentid: parentid || "",
 //   })
 //  }
 //  await MockStore.addItem("imageList", templist)

 //  return {
 //   code: 0,
 //   msg: '成功'
 //  }
 // })

 // 新增文件夹
 Mock.mock("/api/addDir", 'post', req => {
  const { name, parentid } = JSON.parse(req.body)
  MockStore.addItem("imageList", {
   id: utils.guid(),
   dir: true,
   name: name,
   parentid: parentid || "",
  })
  return {
   code: 0,
   msg: "成功"
  }
 })

 // 解散文件夹
 Mock.mock(/\/api\/disband.*/, "delete", async req => {
  const urlSearchText = req.url.split("?")[1]
  const id = utils.getQueryString(urlSearchText, "id")
  const targetid = utils.getQueryString(urlSearchText, "targetid")
  const list = await MockStore.queryAll("imageList", {
   parentid: id,
  })
  await MockStore.updateBatch("imageList", list && list.map(item => ({
   ...item,
   parentid: targetid
  })))
  await MockStore.delItem("imageList", id)
  return {
   code: 0,
   data: null,
   msg: '解散成功'
  }
 })

 // 批量修改
 Mock.mock("/api/imagebatch", 'put', async req => {
  const data = JSON.parse(req.body)
  await MockStore.updateBatch("imageList", data)
  return {
   code: 0,
   msg: '修改成功'
  }
 })

 // 单个修改
 Mock.mock("/api/image", 'put', async req => {
  const data = JSON.parse(req.body)
  await MockStore.updateItem("imageList", data)
  return {
   code: 0,
   msg: '修改成功'
  }
 })

 // 单个删除
 Mock.mock(/\/api\/imagesingle.*/, 'delete', async req => {
  const urlSearchText = req.url.split("?")[1]
  const id = utils.getQueryString(urlSearchText, "id")
  await MockStore.delItem("imageList", id)
  return {
   code: 0,
   msg: '删除成功'
  }
 })

 // 批量删除
 Mock.mock(/\/api\/imagebatch.*/, 'delete', async req => {
  const urlSearchText = req.url.split("?")[1]
  console.log(urlSearchText)
  const ids = utils.getQueryString(urlSearchText, "ids")
  console.log(ids)
  await MockStore.delBatch("imageList", ids && ids.split(","))
  return {
   code: 0,
   msg: '删除成功'
  }
 })

 // 文件夹拉平
 Mock.mock("/api/flatall", "post", async req => {
  const list = await MockStore.queryItems("imageList",)
  await MockStore.updateBatch("imageList", list && list.filter(item => !!item.parentid).map(item => ({
   ...item,
   parentid: ""
  })))
  return {
   code: 0,
   data: null,
   msg: '成功'
  }
 })

 // 获取列表
 Mock.mock(/\/api\/imageList.*/, 'get', async (req) => {
  const urlSearchText = req.url.split("?")[1]
  const page = +utils.getQueryString(urlSearchText, "page")
  const pagesize = +utils.getQueryString(urlSearchText, "pagesize")
  const parentid = utils.getQueryString(urlSearchText, "parentid")

  const params = {
   parentid,
  }

  const res = await MockStore.queryPage("imageList", params, page, pagesize, [],)
  return {
   code: 0,
   data: res
  }

 })
} 