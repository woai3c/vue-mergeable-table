import MergeableTable from './MergeableTable.vue'

const install = function(Vue, opts = {}) {
    Vue.component('MergeableTable', MergeableTable)
}

const API = {
    install,
}

if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue)
}

export default API
