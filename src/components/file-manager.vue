<template>
  <div @contextmenu="containermenu($event)" @mousedown="containermousedown">
<div class="align-center">
  <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in pidpaths" :key="index">
        <span v-if="index === pidpaths.length - 1">{{ item.name }}</span>
        <a v-else type="text" @click="clickPath(item)" style="color: #6a62f2">{{
          item.name
        }}</a>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <el-button v-if="Array.isArray(pidpaths) && pidpaths.length > 1" type="text" @click="pidback" style="margin-left: 12px; cursor: pointer;">返回上一层</el-button>
</div>

    <div style="margin-top: 20px">
      <el-button type="primary" size="small" @click="upload">上传</el-button>
      <el-button type="primary" size="small" @click="addDir">新建文件夹</el-button>
      <el-button v-if="show_paste" size="small" type="primary" @click="pasteHere">粘贴到此</el-button>
      <el-button type="primary" size="small" @click="getImageList()">刷新</el-button>
      <el-button type="primary" size="small">同步到服务器</el-button>
      <!-- <el-button type="primary"  size="small" >排序方式</el-button> -->
      <!-- <el-button type="danger"  size="small"  @click="shear()">批量剪切</el-button>
      <el-button type="danger"  size="small"  @click="delItems()">批量删除</el-button> -->
      <!-- <el-button type="danger"  size="small"  @click="flatAll()">全部拉平</el-button> -->
    </div>

    <div class="image-container">
      <div v-for="(item, index) in list" :key="index" :id="'image_item_' + item.id" class="image-item" :class="{
        dir: item.dir,
        selected: selectList.findIndex((item1) => item1.id === item.id) > -1,
      }" @dblclick.stop="clickFoldItem(item)" @contextmenu="contextmenu($event, index)"
        @mousedown="mouseDown($event, index)">
        <!-- <div v-if="item.dir" class="image">
          <i class="el-icon-folder"></i>
        </div> -->
        <div class="image">
          <img v-if="item.dir" class="image-dir" src="../common/images/文件夹.png" alt="" />
          <img v-else class="image-image" :src="item.url" alt="" />
        </div>

        <div class="image-name">
          <!-- <input v-if="item.rename_active" v-model="item.name" @keyup.enter="item.rename_active=undefined;updateItem(item);"> -->
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>
    <!-- {{ dataForm.page }} / {{ dataForm.pagesize }} -->
    <div v-for="(item, index) in pidpaths" :key="index" style="display: flex; justify-content: center;">
      <el-pagination v-if="index === pidpaths.length - 1" :current-page="item.page" :page-size="dataForm.pagesize"
        layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 30]" :total="listTotal"
        @current-change="changePage" @size-change="handleSizeChange" style="margin: 0 auto;"></el-pagination>
    </div>

    <el-dialog title="新建文件夹" :visible.sync="dirShow" append-to-body>
      <el-form ref="dirFormRef" :model="dirForm" :rules="nameRules">
        <el-form-item prop="name" label="文件夹名称">
          <el-input v-model="dirForm.name"></el-input>
        </el-form-item>

      </el-form>
      <template slot="footer">
        <el-button @click="dirShow = false">取消</el-button>
        <el-button type="primary" @click="submitDir">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog title="重命名" :visible.sync="renameShow" append-to-body>
      <el-form ref="renameFormRef" :model="renameForm" :rules="nameRules">
        <el-form-item prop="name" label="名称">
          <el-input v-model="renameForm.name"></el-input>
        </el-form-item>
      </el-form>

      <template slot="footer">
        <el-button @click="renameShow = false">取消</el-button>
        <el-button type="primary" @click="submitRename">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import utils from "../utils";
import debounce from "lodash/debounce";
import keydown_mixin from "../mixins/keydown.js"
export default {
  name: "file-manager",
  mixins: [keydown_mixin],
  data () {
    return {
      dataForm: {
        page: 0,
        pagesize: 10,
        parentid: "", // 父节点id，如果没有那么就是全部
        searchText: "", // 搜索内容，如果存在那么就是搜索全部，将pid清空
      },
      pidpaths: [
        {
          name: "全部",
          parentid: "",
          page: 0,
          pagesize: 10,
        },
      ],
      list: [],
      listTotal: 0,

      dirForm: {
        name: "",
        parentid: "",
      },
      dirShow: false,
      renameForm: {
        name: "",
      },
      renameShow: false,

      nameRules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' },
        ],
      },

      selectList: [],
      shearList: [], // 剪切
      copyList: [], // 复制

      originPath: {
        x: 0,
        y: 0,
        fold_index: 0,
        click_type: "",
      },
    };
  },
  computed: {
    show_paste () {
      // 是否显示粘贴
      return Array.isArray(this.shearList) && this.shearList.length > 0;
    },
  },
  mounted () {
    this.refreshImageList();

  },
  methods: {

    /**
     * 上传文件
     */
    upload () {
      utils.upload(
        {
          accept: "image/*",
          multiple: true,
        },
        async (tempFiles) => {
          const loading = this.$loading({
            lock: true,
            text: "上传中",
            spinner: "el-icon-loading",
            background: "rgba(0, 0, 0, 0.2)",
          });
          // todo // 构想 // 上传将图片shift到列表中，一个一个加载上传进度
          for (let i = 0; i < tempFiles.length; i++) {
            const formData = new FormData();
            formData.append("file", tempFiles[i]);
            formData.append(
              "parentid",
              this.pidpaths[this.pidpaths.length - 1].parentid
            );
            const res = await this.$axios.post("/api/upload", formData, {
              hideloading: true,
            });
          }
          //     const isLt100M = this.fileList.every(
          //   (file) => file.size / 1024 / 1024 < 100
          // );


          // const formData = new FormData();
          // //注意此处是item.raw，如果直接使用files，那么不会有数据传输到后端
          // tempFiles.forEach((item) => {
          //   formData.append("files", item.raw);
          // });
          // formData.append(
          //   "parentid",
          //   this.pidpaths[this.pidpaths.length - 1].parentid
          // );
          // const res = await this.$axios.post("/api/uploadbatch", formData, {
          //   headers: {
          //     "Content-Type": "multipart/form-data"
          //   }
          // })
          this.getImageList();
          loading.close();
        }
      );
    },
    /**
     * 刷新
     */
    async refreshImageList () {
      if (this.dataForm.page === 1 && this.dataForm.pagesize === 10) {
        this.getImageList();
      } else {
        this.pidpaths[this.pidpaths.length - 1].page = 1;
        this.pidpaths[this.pidpaths.length - 1].pagesize = 10
        this.dataForm.page = 1
        this.dataForm.pagesize = 10
        this.getImageList();
      }
    },
    /**
     * 分页页面点击
     * @param {number} p
     */
    changePage (p) {
      this.dataForm.page = p
      this.pidpaths[this.pidpaths.length - 1].page = p
      this.getImageList()
    },
    /**
     * 每页数量改变
     */
    handleSizeChange (ps) {
      this.dataForm.page = 1
      this.pidpaths[this.pidpaths.length - 1].page = 1
      this.dataForm.pagesize = ps
      this.pidpaths[this.pidpaths.length - 1].pagesize = ps
      this.getImageList()
    },
    /**
     * 获取文件/文件夹列表
     */
    async getImageList () {
      const res = await this.$axios.get(
        `/api/imageList?page=${this.dataForm.page}&pagesize=${this.dataForm.pagesize
        }&parentid=${this.pidpaths[this.pidpaths.length - 1].parentid}`
      );
      if (res.code === 0) {
        this.list = res.data.list;
        this.listTotal = res.data.total;

        this.selectList = [];

      }
    },
    /**
     * 弹出新建文件夹
     */
    addDir () {
      this.dirShow = true;
    },
    /**
     * 新建文件夹提交
     */
    submitDir () {
      this.$refs.dirFormRef && this.$refs.dirFormRef.validate(async valid => {
        if (valid) {
          const res = await this.$axios.post("/api/addDir", {
            ...this.dirForm,
            parentid: this.pidpaths[this.pidpaths.length - 1].parentid,
          });
          if (res.code === 0) {
            this.getImageList();
            this.dirShow = false;
          }
        }
      })

    },
    /**
     * rename
     */
    async submitRename () {
      this.$refs.dirFormRef && this.$refs.dirFormRef.validate(async valid => {
        if (valid) {
          const renameList = this.selectList.map(item => ({
            ...item,
            name: this.renameForm.name
          }))
          const res = await this.$axios.put("/api/imagebatch", renameList)
          if (res.code === 0) {
            this.renameShow = false
            this.getImageList();
          }
        }
      })

    },
    /**
     * 修改文件/文件夹数据
     * @param {*} item
     */
    async updateItem (item) {
      const res = await this.$axios.put("/api/image", item);
      if (res.code === 0) {
        this.getImageList();
      }
    },
    /**
     * 批量粘贴，from剪切
     */
    async pasteHere (ev) {
      if (ev) {
        ev.stopPropagation()
        ev.preventDefault()
      }
      if (!Array.isArray(this.shearList) || this.shearList.length === 0) {
        this.$message.error("请先剪切内容")
        return
      }
      const parentid = this.pidpaths[this.pidpaths.length - 1].parentid || "";
      const res = await this.$axios.put("/api/imagebatch", this.shearList && this.shearList.map(item => ({
        ...item,
        parentid: parentid,
      })));
      this.shearList = [];
      this.getImageList();
    },
    async disband_fold (id, targetid) {
      const res = await this.$axios.delete(
        "/api/disband?id=" + id + "&targetid=" + targetid
      );
      if (res.code === 0) {
        this.$message.success("解散成功");
        this.getImageList();
      }
    },
    /**
     * 批量删除/删除
     */
    async delItems (id) {
      let ids = "";
      if (id) {
        // 非批量删除
        ids = id;
      } else {
        if (!Array.isArray(this.selectList) || this.selectList.length === 0) {
          this.$message.error("请先选择文件/文件夹");
          return;
        }
        ids = this.selectList.map((item) => item.id).join(",");
      }

      const res = await this.$axios.delete(`/api/imagebatch?ids=${ids}`);
      if (res.code === 0) {
        this.$message.success("删除成功");
        this.getImageList();
      }
    },
    /**
     * flatAll
     */
    async flatAll () {
      const res = await this.$axios.post(`/api/flatall`);
      if (res.code === 0) {
        this.$message.success("成功");
        this.getImageList();
      }
    },
    /**
     * 双机文件/文件夹
     * @param {*} item
     */
    clickFoldItem (item) {
      if (item.dir) {
        this.pidpaths.push({
          name: item.name,
          parentid: item.id,
          page: 1,
          pagesize: 10,
        });
        this.refreshImageList();
      }
    },
    /**
     * 选择文件/文件夹
     * @param {*} item
     */
    selectItem (click_index, clicktype) {
      const item = this.list[click_index]
      const findIndex = this.selectList.findIndex((item1) => item1 === item);

      switch (clicktype) {
        case 'ctrl_click':
          if (findIndex > -1) {
            this.selectList.splice(findIndex, 1);

            return false // 返回失败，阻止拖拽
          } else {
            this.selectList.push(item);
          }
          break
        case 'shift_click':
          let selectIndexs = []
          this.selectList.forEach((item, index) => {
            const fIndex = this.list.findIndex(item1 => item1 === item)
            if (fIndex > -1) {
              selectIndexs.push(fIndex)
            }
          })
          selectIndexs.sort()

          const min = Math.min(...selectIndexs)
          const tempSelectList = []
          if (click_index < min) {
            for (let i = click_index; i < min + 1; i++) {
              tempSelectList.push(this.list[i])
            }
            this.selectList = tempSelectList
          } else if (click_index > min) {
            for (let i = min; i < click_index + 1; i++) {
              tempSelectList.push(this.list[i])
            }
            this.selectList = tempSelectList
          }
          return this.selectList
        case 'click':
          if (findIndex > -1) { // 选中了已选中的条目，可能是拖拽，所以要等到回弹再那啥
            return item
          } else {
            this.selectList = [item]
          }
      }


    },
    /**
     * 剪切
     */
    shear (ev) {
      if (ev) {
        ev.stopPropagation()
        ev.preventDefault()
      }
      if (!Array.isArray(this.selectList) || this.selectList.length === 0) {
        this.$message.error("请先选择")
        return
      }
      this.shearList = this.selectList;
      this.$message.success("已剪切到粘贴板");
    },
    /**
     * 点击面包屑
     * @param {*} item
     */
    clickPath (item) {
      const index = this.pidpaths.findIndex((item1) => item1 === item);
      this.pidpaths = this.pidpaths.slice(0, index + 1);
      this.dataForm.page = this.pidpaths[this.pidpaths.length - 1].page
      this.dataForm.pagesize = this.pidpaths[this.pidpaths.length - 1].pagesize
      this.getImageList();
    },
    /**
     * 返回面包屑上一层
     */
    pidback() {
      this.pidpaths = this.pidpaths.slice(0, this.pidpaths.length - 1);
      this.dataForm.page = this.pidpaths[this.pidpaths.length - 1].page
      this.dataForm.pagesize = this.pidpaths[this.pidpaths.length - 1].pagesize
      this.getImageList();
    },
    /**
     * 开始拖拽项目
     * @param {*} down_ev
     * @param {*} fold_index
     */
    mouseDown (down_ev, fold_index) {
      down_ev.stopPropagation();
      down_ev.preventDefault();

      document.onmousemove = null
      document.onmouseup = null

      this.originPath.x = down_ev.clientX;
      this.originPath.y = down_ev.clientY;

      let up_set_item; // 在鼠标弹起时设置，防止拖拽影响
      if (down_ev.ctrlKey && down_ev.button === 0) {
        // ctrl + 鼠标左键组合键触发
        this.selectItem(fold_index, 'ctrl_click');
      } else if (down_ev.shiftKey && down_ev.button === 0) {
        // shift + 左键组合
        this.selectItem(fold_index, 'shift_click');
      } else if (down_ev.button === 0) {
        up_set_item = this.selectItem(fold_index, 'click');
      }
      if (down_ev.button === 2) {
        if (!this.selectList.includes(this.list[fold_index])) {
          this.selectList = [this.list[fold_index]]
        }
        // this.contextmenu(down_ev, fold_index)
      }



      if (down_ev.button === 0) { // 只有左键才能移动
        let moved = false // 是否有移动
        document.onmousemove = (move_ev) => {
          move_ev.stopPropagation();
          move_ev.preventDefault();


          moved = true
          this.move_deel(move_ev); // 点击方法
        };
        document.onmouseup = (up_ev) => {
          // console.log("onmoues up", fold_index, down_ev);
          up_ev.stopPropagation();
          up_ev.preventDefault();

          if (up_set_item && !moved) {
            this.selectList = [up_set_item]
          }

          document.onmousemove = null;
          this.move_end_deel(up_ev, async (dir_index) => {
            // 移动成功，移动到的目录的下标
            const target_item = this.list[dir_index];
            if (target_item.dir) {
              // 如果是目录，那么就移动进去
              if (!Array.isArray(this.selectList) || this.selectList.length === 0) return
              await this.$axios.put("/api/imagebatch", this.selectList.map(item => ({
                ...item,
                parentid: target_item.id,
              })))
              this.getImageList()
              this.$message.success("移动成功");
            }
          });
        };
      } else if (down_ev.button === 2) {

      }

    },
    /**
     * 事件处理
     * @param {*} move_ev 鼠标移动事件
     */
    move_deel (move_ev) {
      const { clientX, clientY } = move_ev;
      for (let index = 0; index < this.list.length; index++) {
        if (this.selectList.includes(this.list[index])) {
          const { x, y } = this.originPath;
          const element = document.getElementById("image_item_" + this.list[index].id);
          element.style.transform = `translate(${clientX - x}px, ${clientY - y
            }px)`;
          element.style.zIndex = 123;
        } else {
          if (this.list[index].dir) {
            const element = document.getElementById("image_item_" + this.list[index].id);
            const { top, bottom, left, right } =
              element.getBoundingClientRect();
            if (
              left < clientX &&
              right > clientX &&
              top < clientY &&
              bottom > clientY
            ) {
              element.classList.add("active");
            } else {
              element.classList.remove("active");
            }
          }
        }
      }
    },
    /**
     * 拖拽结束事件
     * @param {*} up_ev
     * @param {*} callback
     */
    move_end_deel (up_ev, callback) {
      const { clientX, clientY } = up_ev;
      let target_index = -1
      for (let index = 0; index < this.list.length; index++) {
        const element = document.getElementById("image_item_" + this.list[index].id);
        if (element) {
          if (this.selectList.includes(this.list[index])) {
            element.style.transform = `translate(0, 0)`;
            element.style.zIndex = 12;
          } else {
            const { top, bottom, left, right } = element.getBoundingClientRect();
            if (
              left < clientX &&
              right > clientX &&
              top < clientY &&
              bottom > clientY
            ) {
              target_index = index
            }

          }
          element.classList.remove("active");
        }

      }

      // 目标文件// 如果是文件夹就进去
      if (typeof callback === "function" && target_index > -1) {
        callback(target_index);
      }
    },
    /**
     * 右键菜单
     * @param {*} ev
     * @param {*} fold_index
     */
    contextmenu (ev, fold_index,) {
      if (ev) { // 默认阻止
        ev.stopPropagation();
        ev.preventDefault();
      }

      // console.log(fold_index);

      const fold_item = this.list[fold_index];

      if (!this.selectList.includes(fold_item)) {
        this.selectList = [fold_item]
      }

      const { clientX, clientY } = ev

      if (fold_item.dir) {
        utils.createRightMenu(clientX, clientY, [
          {
            icon_class: "el-icon-upload",
            text: "同步到服务器",
            click: (item) => {
              this.disband_fold(fold_item.id, fold_item.parentid || "");
            },
          },
          {
            icon_class: "el-icon-folder-opened",
            text: "打开",
            click: (item) => {
              this.clickFoldItem(fold_item);
            },
          },
          {
            icon_class: "el-icon-scissors",
            text: "剪切",
            click: (item) => {
              this.shearList = this.selectList
              this.$message.success("已剪切到粘贴板");
            },
          },
          {
            icon_class: "",
            text: "重命名",
            click: (item) => {
              this.renameShow = true
              this.renameForm.name = fold_item.name
            },
          },
          {
            icon_class: "",
            text: "解散",
            click: (item) => {
              this.disband_fold(fold_item.id, fold_item.parentid || "");
            },
          },
        ]);
      } else {
        utils.createRightMenu(clientX, clientY, [
          {
            icon_class: "el-icon-upload",
            text: "同步到服务器",
            click: (item) => {
              this.disband_fold(fold_item.id, fold_item.parentid || "");
            },
          },
          {
            icon_class: "el-icon-download",
            text: "下载",
            click: (item) => {
              console.log(item);
            },
          },
          {
            icon_class: "el-icon-scissors",
            text: "剪切",
            click: (item) => {
              this.shearList = this.selectList
              this.$message.success("已剪切到粘贴板");
            },
          },
          {
            icon_class: "",
            text: "重命名",
            click: (item) => {
              this.renameShow = true
              this.renameForm.name = fold_item.name

            },
          },
          {
            icon_class: "el-icon-delete",
            text: "删除",
            click: (item) => {
              this.delItems()
            },
          },
          {
            icon_class: "el-icon-view",
            text: "预览",
            click: (item) => {
              this.previewSelect()
            },
          }
        ]);
      }
    },
    /**
     * 预览选中的图片
     */
    previewSelect () {
      if (Array.isArray(this.selectList)) {
        const imageList = this.selectList.filter(item => !item.dir)
        if (imageList.length === 1) {
          // # 单图预览
          this.$hevueImgPreview({
            url: imageList[0].url
          })
        } else if (imageList.length > 1) {
          // # 多图预览
          this.$hevueImgPreview({
            multiple: true, // 开启多图预览模式
            nowImgIndex: 0, // 多图预览，默认展示第二张图片
            imgList: imageList.map(item => item.url), // 需要预览的多图数组
          })
        }
      }
    },
    /**
     * 判断是否点击在项目上，如果不是返回false
     * @param {*} ev
     */
    isClickOnItem (ev) {
      const { clientX, clientY } = ev
      let flag = false
      for (let index = 0; index < this.list.length; index++) {
        const element = document.getElementById("image_item_" + this.list[index].id);
        const { top, bottom, left, right } = element.getBoundingClientRect();
        if (
          left < clientX &&
          right > clientX &&
          top < clientY &&
          bottom > clientY
        ) {
          flag = true
        }
      }
      return flag
    },
    /**
     * 父组件右键菜单
     * @param {*} ev
     */
    containermenu (ev) {
      ev.stopPropagation();
      ev.preventDefault();

      this.containermousedown(ev)

      let rightMenuItems = [
        {
          icon_class: "el-icon-upload2",
          text: "上传",
          click: (item) => {
            this.upload()
          },
        },
        {
          icon_class: "el-icon-folder-add",
          text: "新建文件夹",
          click: (item) => {
            this.addDir()
          },
        },
        {
          icon_class: "el-icon-refresh",
          text: "刷新",
          click: (item) => {
            this.getImageList()
          },
        },

      ]
      if (Array.isArray(this.shearList) && this.shearList.length > 0) {
        rightMenuItems.push({
          icon_class: "",
          text: "粘贴",
          click: (item) => {
            this.pasteHere()
          },
        },)
      }
      utils.createRightMenu(ev.clientX, ev.clientY, rightMenuItems);
    },

    containermousedown (ev) {
      if (!this.isClickOnItem(ev)) {
        this.selectList = []
        document.onmousemove = null
        document.onmouseup = null
        ev.stopPropagation()
        ev.preventDefault()
      }
    }
  },
};
</script>

<style lang="scss" scoped>
$grup-width: 20px;

.image-container {
  padding-top: $grup-width;
  padding-right: -$grup-width;
  overflow: hidden;

  .image-item {
    padding: $grup-width / 2;
    margin: $grup-width / 2;
    float: left;
    position: relative;
    z-index: 12;
    box-sizing: border-box;
    border-radius: 12px;
    border: 1px solid transparent;

    &.active {
      .image {
        filter: grayscale(50%);
      }
    }

    &:hover {
      background: rgba(58, 208, 255, 0.2);
    }

    &.selected {
      background: rgba(58, 208, 253, 0.36);
      border: 1px solid rgb(58, 133, 253);

      &::after {
        content: '';
        position: absolute;
        display: block;
        top: 5px;
        left: 5px;
        width: 19px;
        height: 19px;
        background-repeat: no-repeat;
        background-size: 19px 19px;
        background-image: url(data:image/png;base64,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);
      }
    }

    .image {
      width: 160px;
      height: 160px;
      display: flex;
      justify-content: center;
      align-items: center;
      object-fit: cover;
      // background: #ccc;
      border-radius: 10px;

      &-image {
        width: 80%;
        height: 80%;
        object-fit: cover;
        border-radius: 10px;
      }

      &-dir {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .image-name {
      width: 160px;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>
<style lang="scss">
@keyframes up-center {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(0);
  }
}

.custom_menu_div {
  position: fixed;
  margin: 0;
  padding: 0;
  overflow: hidden;
  padding: 5px;

  &>ul {
    margin: 0;
    padding: 0;
    overflow: hidden;
    list-style: none;
    animation: up-center .3s ease-in-out;
    background: #fff;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    position: relative;

    &>li {
      list-style: none;
      padding: 9px 13px;
      margin: 0;
      min-width: 100px;
      text-align: center;
      box-sizing: border-box;

      display: flex;
      align-items: center;

      .menu-i-div {
        flex-shrink: 0;

        &>i {
          font-size: 20px;
        }

        width: 32px;
      }

      .menu-text-div {
        flex: 1;
        text-align: left;
      }

      &:not(:first-child) {
        border-top: 1px solid #f2f2f2;
      }

      &:hover {
        background: #f2f2f2;
      }
    }
  }


}
</style>
