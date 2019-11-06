import Vue from 'vue'
import Router from 'vue-router'
import routes from './routers'
import store from '@/store'
import ViewUI from 'view-design'
import { clearCookies, getToken, canTurnTo, setTitle } from '@/libs/util'
import config from '@/config'
const { homeName } = config

Vue.use(Router)
const router = new Router({
  routes,
  mode: 'history'
})
const LOGIN_PAGE_NAME = 'login'

const turnTo = (to, access, next) => {
  if (canTurnTo(to.name, access, routes)) next() // 有权限，可访问
  else next({ replace: true, name: 'error_401' }) // 无权限，重定向到401页面
}

router.beforeEach((to, from, next) => {
  ViewUI.LoadingBar.start()
  const token = getToken()
  if (!token && to.name !== LOGIN_PAGE_NAME) {
    // 未登录且要跳转的页面不是登录页
    next({
      name: LOGIN_PAGE_NAME // 跳转到登录页
    })
  } else if (!token && to.name === LOGIN_PAGE_NAME) {
    // 未登陆且要跳转的页面是登录页
    next() // 跳转
  } else if (token && to.name === LOGIN_PAGE_NAME) {
    // 已登录且要跳转的页面是登录页
    next({
      name: homeName // 跳转到homeName页
    })
  } else {
    const user = store.state.user
    if (typeof user.userList === 'undefined' || user.userList.length === 0) {
      store.dispatch('getUserList')
    }
    if (typeof user.dbTypeList === 'undefined' || user.dbTypeList.length === 0) {
      store.dispatch('getDbTypeList')
    }
    if (typeof user.taskTypeList === 'undefined' || user.taskTypeList.length === 0) {
      store.dispatch('getTaskTypeList')
    }
    if (typeof user.connectionList === 'undefined' || user.connectionList.length === 0) {
      store.dispatch('getConnectionList')
    }
    if (user.hasUserInfo) {
      turnTo(to, user.access, next)
    } else {
      store.dispatch('getUserInfo').then(user => {
        // 拉取用户信息，通过用户权限和跳转的页面的name来判断是否有权限访问;access必须是一个数组，如：['super_admin'] ['super_admin', 'admin']
        turnTo(to, user.access, next)
      }).catch(err => {
        console.log(err)
        clearCookies()
        next({
          name: 'login'
        })
      })
    }
  }
})

router.afterEach(to => {
  setTitle(to, router.app)
  ViewUI.LoadingBar.finish()
  window.scrollTo(0, 0)
})

export default router
