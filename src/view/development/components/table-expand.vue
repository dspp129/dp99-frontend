<style scoped>
.expand-row{
  margin-bottom: 16px;
}
.expand-value{
  margin-left: 20px;
}
</style>
<template>
  <div>
    <Row class="expand-row">
      <Col span="12">
        <span class="expand-key">任务类型</span>
        <span class="expand-value" >{{ row.taskTypeName }}</span>
      </Col>
      <Col span="12">
        <span class="expand-key">开始时间</span>
        <span class="expand-value"><Time :time="row.startTime" type="datetime" /></span>
      </Col>
    </Row>
    <Row>
      <Col span="12">
        <span class="expand-key">计划时间</span>
        <span class="expand-value"><Time :time="row.nextFireTime" type="datetime" /></span>
      </Col>
      <Col span="12">
        <span class="expand-key">结束时间</span>
        <span class="expand-value"><Time :time="row.endTime" type="datetime" /></span>
      </Col>
    </Row>
  </div>
</template>
<script>
export default {
  props: {
    row: Object
  },
  methods: {
  }
}
</script>
