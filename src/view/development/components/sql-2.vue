<template>
  <div class="sql-list">
    <Card dis-hover :padding="0">
      <Row>
        <Col span="7">
          <Card title="执行列表" icon="ios-options" :padding="0" shadow dis-hover>
            <a slot="extra">
              <Icon type="md-add" size="20" @click.stop="newCell"/>
            </a>
            <CellGroup ref="dragable" @on-click="onClickCell">
              <Cell v-for="(item, index) in value"
                :key="index"
                :name="index"
                :title="item.name"
                :label="item.label"
                :selected="value.selectedIndex === index"
                :data-id="item.position" >
                <div slot="extra">
                  <Icon type="md-create" size="16" @click.stop="editCell(item)" class="margin-right-10" />
                  <Poptip
                    confirm
                    transfer
                    placement="right"
                    title="您确认删除这条SQL吗？"
                    @on-ok="removeCell(item, index)">
                    <Icon type="md-close" size="20" class="margin-right-5" />
                  </Poptip>
                </div>
              </Cell>
            </CellGroup>
          </Card>
        </Col>

        <Col span="17" class="sql-list-right">
          <Card :padding="0" shadow dis-hover>
            <div slot="title">
              <Select transfer
                :value="dbType"
                placeholder="数据库类型"
                :disabled="disabled"
                size="small"
                @on-change="changeDbType"
                style="width:120px;" >
                <Option v-for="item in dbTypeList" :value="item.id" :key="item.id">{{ item.name }}</Option>
              </Select>

              <Select ref="connectionSelector"
                transfer
                clearable
                :value="connectionId"
                :disabled="disabled"
                size="small"
                placeholder="数据库连接"
                class="margin-left-10"
                @on-change="changeConnectionId"
                style="width:170px;">
                <Option v-for="item in connectionList" :value="item.id" :key="item.id" v-if="item.dbType === dbType">{{item.name}}</Option>
              </Select>
            </div>
            <div slot="extra">
              <Checkbox :value="true" :disabled="true">逐句提交</Checkbox>
              <Checkbox v-model="runnable" :disabled="true" class="margin-left-5">输出结果</Checkbox>

              <Dropdown trigger="click" placement="bottom-end" class="margin-left-5">
                <Button ghost
                  size="small"
                  type="primary"
                  :disabled="true">快速生成
                  <Icon type="ios-arrow-down"></Icon>
                </Button>
                <DropdownMenu slot="list">
                  <DropdownItem>Truncate</DropdownItem>
                  <DropdownItem>Delete</DropdownItem>
                  <DropdownItem>Merge</DropdownItem>
                  <DropdownItem>Insert on duplicate</DropdownItem>
                  <DropdownItem>Insert overwrite</DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <Button ghost
                size="small"
                type="primary"
                icon="md-play"
                :loading="running"
                :disabled="!runnable"
                @click="runQuery"
                class="margin-left-10">测试
              </Button>
            </div>
            <SqlEditor ref="SqlEditor" v-model="selectedCell.content" :height="editorHeight" :readonly="readonly" />
          </Card>
        </Col>
      </Row>
    </Card>

    <Modal
      class-name="modal-vertical-center"
      v-model="modal"
      :mask-closable="false">
      <div slot="footer">
        <Button shape="circle" icon="md-close" @click="closeModal" />
        <Button ghost
          type="success"
          shape="circle"
          icon="md-checkmark"
          @click="ok"
          :disabled="tempCell.name.length === 0"/>
      </div>
      <Form ref="modal"
        :model="tempCell"
        :label-width="120"
        :rules="ruleValidate"
        @submit.native.prevent
        class="margin-top-20">
        <FormItem label="标题" prop="name" >
          <Input ref="cellName"
            v-model="tempCell.name"
            placeholder="请输入标题..."
            @on-enter="ok"
            style="width: 260px;"/>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>

const initCell = {
  name: '',
  content: '',
  position: 0
}

import SqlEditor from '_c/sql-editor'
import Sortable from 'sortablejs'

export default {
  name: 'sql-2',
  components: {
    SqlEditor
  },
  props: {
    value: Array,
    dbType: Number,
    connectionId: Number,
    disabled: Boolean,
    id: Number
  },
  data () {
    return {
      modal: false,
      tempCell: JSON.parse(JSON.stringify(initCell)),
      selectedCell: JSON.parse(JSON.stringify(initCell)),
      sortable: {},
      myDbType: 0,
      myConnectionId: 0,
      running: false,
      runnable: false,
      readonly: true,

      dbTypeList: this.$store.state.user.dbTypeList,
      connectionList: this.$store.state.user.connectionList,

      ruleValidate: {
        name: [
          { required: true, message: '标题不能为空',trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    newCell () {
      const length = this.value.length
      this.tempCell = {
        name: '新建SQL-' + (length + 1),
        content: '',
        position: length
      }
      this.modal = true
    },
    async ok () {
      const valid = await this.$refs.modal.validate()
      if (!valid) return
      const cell = JSON.parse(JSON.stringify(this.tempCell))
      if (cell.position === this.value.length) {
        this.value.push(cell)
        this.onClickCell(this.value.length-1)
      }
      else this.value.forEach((item, index) => {
        if (item.position === cell.position)
          this.value.splice(index, 1, cell)
      })
      this.closeModal()

    },
    onClickCell (index) {
      this.value.selectedIndex = index
      this.selectedCell = this.value[index]
      this.readonly = false
      this.$refs.SqlEditor.focus()
    },
    editCell (cell) {
      this.tempCell = JSON.parse(JSON.stringify(cell))
      this.modal = true
    },
    closeModal () {
      this.modal = false
      this.$refs.modal.resetFields()
    },
    removeCell (cell, index) {
      const position = cell.position
      this.value.splice(index, 1)
      this.$Message.success('删除成功')

      this.value.forEach(s => {
        if (s.position > position) {
          s.position--
        }
      })

      this.$nextTick(() => {
        const order = Array.from({ length: this.value.length }, (v, i) => { return i.toString() })
        this.sortable.sort(order)
      })

      if (this.value.length === 0) {
        this.readonly = true
        this.selectedCell = JSON.parse(JSON.stringify(initCell))
        return
      }

      // 如果移除的是最后一个，显示上一个
      if (this.value.length === index) this.onClickCell(index - 1)
      else this.onClickCell(index)
    },
    endFunc (e) {
      if (e.oldIndex === e.newIndex) {
        this.onClickCell(e.oldIndex)
      }

      if (e.oldIndex > e.newIndex) {
        this.value.forEach((s, index) => {
          if (s.position === e.oldIndex) {
            s.position = e.newIndex
          } else if (s.position >= e.newIndex && s.position < e.oldIndex) {
            s.position++
          }
        })
      }

      if (e.oldIndex < e.newIndex) {
        this.value.forEach((s, index) => {
          if (s.position === e.oldIndex) {
            s.position = e.newIndex
          } else if (s.position > e.oldIndex && s.position <= e.newIndex) {
            s.position--
          }
        })
      }
    },
    changeDbType (value) {
      this.$emit('update:dbType', value)
      this.$refs.connectionSelector.clearSingleSelect()
    },
    changeConnectionId (value) {
      this.$emit('update:connectionId', value)
    },
    runQuery () {
    }
  },
  updated () {
    if (this.modal) this.$refs.cellName.focus()
    else this.$refs.SqlEditor.focus()
  },
  mounted () {
    this.sortable = Sortable.create(this.$refs.dragable.$el, {
      group: {
        name: 'list',
        pull: true
      },
      sort: true,
      animation: 120,
      onEnd: this.endFunc
    })
  },
  computed: {
    editorHeight () {
      return this.$store.state.app.fullHeight - 260
    }
  },
  watch: {
    'id' (id) {
      this.selectedCell = JSON.parse(JSON.stringify(initCell))
      if (typeof id === 'undefined') return
      if (this.value.length === 0 ) {
        this.readonly = true
        return
      }
      if (typeof this.value.selectedIndex === 'undefined') this.readonly = true
      else this.onClickCell(this.value.selectedIndex)
    }
  }
}
</script>




<style lang="less">

.sql-list .ivu-cell{
  border-right: 2px solid transparent;
  padding-right: 0px;
}
.sql-list .ivu-cell-title{
  line-height: 38px;
}

.sql-list .ivu-cell-footer{
  right: 10px;
}
.sql-list .ivu-cell-selected{
  border-right: 2px solid #2d8cf0 !important;;
  font-weight: bold;
}

.sql-list-right .ivu-select-small{
  height: 22px;
}

</style>