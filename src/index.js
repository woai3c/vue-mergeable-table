import VueMergeableTable from './VueMergeableTable.vue'

const install = function(Vue, opts = {}) {
    Vue.component('VueMergeableTable', VueMergeableTable)
}

const API = {
    install,
}

if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue)
}

export default API
