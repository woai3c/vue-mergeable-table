<script>
export default {
    name: 'VueMergeableTable',
    props: {
        options: {
            type: Object,
            default: () => {},
        },
        highlight: {
            type: Boolean,
            default: false,
        },
    },
    watch: {
        options() {
            this.init()
        }
    },
    data() {
        return {
            cols: 0,
            rows: 0,
            listData: [],
            tableData: [],
        }
    },
    created() {
        this.init()
    },
    methods: {
        init() {
            if (!Object.keys(this.options).length) return
            this.cols = this.options.cols
            this.rows = this.options.rows
            this.listData = this.options.data
            this.tableData = this.createTableData()
            this.sort()
            this.mergeData()
        },

        createTableData() {
            const { rows, cols } = this
            const result = []
            for (let row = 0; row < rows; row++) {
                const arr = []
                for (let col = 0; col < cols; col++) {
                    arr.push({})
                }

                result.push(arr)
            }

            return result
        },

        sort() {
            const { rows, cols, tableData, listData } = this
            if (!listData) return

            for (let i = 0, len = listData.length; i < len; i++) {
                const mergeOption = listData[i].merge
                if (!mergeOption) continue
                const rowStart = mergeOption.row
                const colStart = mergeOption.col
                
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        if (row == rowStart && col == colStart) {
                            tableData[row][col] = { ...listData[i] }
                            listData[i] = null
                            
                            tableData[row][col].colspan = mergeOption.colspan? mergeOption.colspan : 1
                            tableData[row][col].rowspan = mergeOption.rowspan? mergeOption.rowspan : 1
                            if (mergeOption.class) tableData[row][col].class = mergeOption.class
                        }
                    }
                }
            }
        },
        
        replaceData() {
            const data = this.tableData
            const listData = this.listData
            let index = 0
            for (let i = 0, len = data.length; i < len; i++) {
                const arr = data[i]
                for (let j = 0, l = arr.length; j < l; j++) {
                    if (arr[j].content) continue
                    let item = listData[index]
                    while (!item) {
                        item = listData[++index]
                        if (item === undefined) break
                    }

                    arr[j] = item === undefined? {} : item
                    index++
                }
            }
            
            return data
        },

        mergeData() {
            const data = this.tableData
            for (let i = 0, len = data.length; i < len; i++) {
                let arr = data[i]
                if (!arr) continue
                let j = 0
                let isContinuousMerge = false
                let colStart
                while (j < arr.length) {
                    if (arr[j].rowspan && arr[j].colspan) {
                        // 当前面有连续多个跨多行的表格合并时，在它后面的下一列，如果合并的话，也应该紧跟着。
                        // 但现在是隔开一列。
                        // 修复方法：当有连续合并的时候，用第一次合并的列当索引
                        if (!isContinuousMerge) {
                            isContinuousMerge = true
                            colStart = j
                        }

                        this.deleteRowAndCol(data, i, arr[j].rowspan + i - 1, colStart, arr[j].colspan)
                        arr = data[i]
                    } else {
                        isContinuousMerge = false
                    }
                    
                    j++
                }
            }
        },
            
        deleteRowAndCol(data, rowStart, rowEnd, colStart, colspan) {
            const start = rowStart
            while (rowStart <= rowEnd) {
                // 用于存储分成两截的数组的前段数据部分
                const tempArry = []
                let span = colspan
                if (start === rowStart) {
                    span = colspan - 1
                }
                
                if (!span) {
                    rowStart++
                    continue
                }

                const arr = data[rowStart]
                const arr2 = []
                let len = arr.length
                
                // 大于 0 的情况下要从头开始
                if (colStart >= len) {
                    let i = 0
                    for (; i < len; i++) {
                        if (!span) {
                            arr2.push(arr[i])
                            continue
                        }
                    
                        if (arr[i].rowspan && arr[i].colspan) {
                            arr2.push(arr[i])
                        } else {
                            span--
                        }
                    }
                } else {
                    let i = colStart
                    let isFirst = true
                    colStart--
                    for (; i != colStart; i = ++i % len) {
                        if (!span) {
                            if (i < colStart) {
                                tempArry.push(arr[i])
                            } else {
                                arr2.push(arr[i])
                            }

                            continue
                        }
                        
                        if (arr[i].rowspan && arr[i].colspan) {
                            if (i < colStart) {
                                tempArry.push(arr[i])
                            } else {
                                arr2.push(arr[i])
                            }
                        } else {
                            span--
                        }
                    
                        if (isFirst) {
                            colStart++
                            isFirst = false
                        }
                    }
                }

                data[rowStart] = [...tempArry, ...arr2]
                rowStart++
            }
        },

        generateTable(h) {
            const data = this.replaceData()
            const result = []
            let row = 0
            for (let i = 0, len = data.length; i < len; i++) {
                const tdData = data[i]
                const tds = []
                for (let j = 0, l = tdData.length; j < l; j++) {
                    const td = tdData[j]
                    const attrs = {}
                    if (td.colspan) {
                        attrs.colspan = td.colspan
                    }

                    if (td.rowspan) {
                        attrs.rowspan = td.rowspan
                    }

                    attrs['data-col'] = j
                    attrs.class = td.class? td.class + ' mergeable-td' : 'mergeable-td'
                    tds.push(
                        h('td', { attrs }, td.content)
                    )
                }

                result.push(h('tr', {
                    attrs: {
                        class: 'mergeable-tr',
                        'data-row': row++,
                    },
                    on: {
                        click: (e) => {
                            const target = e.target
                            if (target.nodeName == 'TD') {
                                const parent = target.parentNode
                                this.$emit(
                                    'click',
                                    this.tableData[parent.dataset.row][target.dataset.col],
                                    this.getTrData(parent),
                                    parent.dataset.row,
                                    target.dataset.col,
                                )
                            }
                        },
                    },
                }, tds))
            }

            return result
        },

        getTrData(tr) {
            const tableData = this.tableData
            const tds = tr.children
            const result = []
            for (let i = 0, len = tds.length; i < len; i++) {
                result.push(tableData[tr.dataset.row][tds[i].dataset.col])
            }

            return result
        },
    },

    render(h) {
        let className = 'vue-mergeable-table'
        if (this.highlight) {
            className += ' highlight'
        }

        return h(
            'table',
            {
                attrs: {
                    class: className,
                },
            },
            this.generateTable(h)
        )
    },
}
</script>

<style>
.vue-mergeable-table {
    border-collapse: collapse;
    box-sizing: border-box;
    color: #606266;
    font-size: 14px;
}
.vue-mergeable-table td {
    border: 1px solid #ebeef5;
    width: 44px;
    box-sizing: border-box;
}
.vue-mergeable-table tr {
    height: 44px;
    box-sizing: border-box;
}
.vue-mergeable-table.highlight td:hover {
    background-color: #f5f7fa;
}
</style>
