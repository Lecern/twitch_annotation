function initTable() {
    // $('#table').bootstrapTable('destroy');
    $('#table').bootstrapTable({
        // data: getSamples(),
        method: "get",
        url: "/samples",
        toolbar: "#toolbar",
        sidePagination: "true",
        striped: true,
        uniqueId: "ori_id",
        pageSize: 5,
        pageList: [5, 10, 50, 100, 500, 1000],
        pagination: true,
        paginationShowPageGo: true,
        sortable: false,
        striped: true,
        sidePagination: 'client',
        showRefresh: true,
        pageNumber: 1,
        showExport: true,
        exportTypes: ['Excel', 'Text', 'Json'],
        onPostBody: function () {
            $('.selectpicker').selectpicker({});
        },
        rowStyle: function (row, index) {
            switch (row['status']) {
                case -1:
                    return {css: {'background-color': '#f4e7e6'}}
                case 0:
                    return {css: {'background-color': '#fcf8e3'}}
                case 1:
                    return {css: {'background-color': '#dff0d8'}}
            }
            return {}
        },
        columns: [{
            field: 'ori_id',
            title: 'ori_id',
            visible: false
        },
            {
                field: 'Number',
                title: '#',
                align: 'center',
                valign: 'middle',
                width: 20,
                formatter: function (value, row, index) {
                    return index + 1;
                    // var pageSize=$('#table').bootstrapTable('getOptions').pageSize;
                    // var pageNumber=$('#table').bootstrapTable('getOptions').pageNumber;
                    // return pageSize * (pageNumber - 1) + index + 1;
                }
            },
            {
                field: 'comment',
                title: 'Post'
            },
            {
                field: 'offensive',
                title: 'Offensive',
                titleTooltip: 'Is it offensive?',
                align: 'center',
                valign: 'middle',
                width: 100,
                formatter: function (value, row, index) {
                    var offensive = row['offensive'];
                    return ['<select class="selectpicker" id="offensive_' + row['ori_id'] + '" data-style="btn-primary" title="Offensive" data-width="fit">',
                        '<option data-icon="fas fa-check-circle" value="OFF"' + (offensive && offensive === "OFF" ? 'selected' : '') + '>OFF</option>',
                        '<option data-icon="fas fa-times-circle" value="NOT"' + (offensive && offensive === "NOT" ? 'selected' : '') + '>NOT</option>',
                        '<option value="Unreadable" data-content="<span class=\'badge badge-danger\'>Unreadable</span>"' + (offensive && offensive === "Unreadable" ? 'selected' : '') + '>Unreadable</option>',
                        '</select>'].join("");
                },
                events: {
                    'change .selectpicker': function (e, value, row, index) {
                        var valueSelected = $('#offensive_' + row['ori_id']).selectpicker('val');
                        row['offensive'] = valueSelected;
                        if (valueSelected === "NOT" || valueSelected === "Unreadable") {
                            $('#target_' + row['ori_id']).prop('disabled', true);
                            $('#target_' + row['ori_id']).selectpicker('val', ['noneSelectedText']);
                            $('#target_' + row['ori_id']).selectpicker('refresh');

                            $('#type_' + row['ori_id']).prop('disabled', true);
                            $('#type_' + row['ori_id']).selectpicker('val', ['noneSelectedText']);
                            $('#type_' + row['ori_id']).selectpicker('refresh');
                            if ('target' in row) {
                                delete row['target'];
                            }
                            if ('type' in row) {
                                delete row['type'];
                            }
                            if (valueSelected === "Unreadable") {
                                $('#modal').modal('toggle');
                            }
                        } else if (valueSelected == "OFF") {
                            $('#target_' + row['ori_id']).prop('disabled', false);
                            $('#target_' + row['ori_id']).selectpicker('refresh');
                            $('#type_' + row['ori_id']).prop('disabled', false);
                            $('#type_' + row['ori_id']).selectpicker('refresh');
                        }
                        update_samples(row, e);
                    }
                }
            },
            {
                field: 'target',
                title: 'Target',
                align: 'center',
                valign: 'middle',
                width: 100,
                formatter: function (value, row, index) {
                    var offensive = row['offensive'];
                    var target = row['target'];
                    return ['<select class="selectpicker" id="target_' + row['ori_id'] + '" ' + (offensive && offensive === 'OFF' ? '' : 'disabled') + ' data-style="btn-success" title="Target" data-width="fit">',
                        '<option data-icon="fas fa-user" value="IND"' + (target && target === "IND" ? 'selected' : '') + '>IND</option>',
                        '<option data-icon="fas fa-users" value="GRP"' + (target && target === "GRP" ? 'selected' : '') + '>GRP</option>',
                        '<option data-icon="fas fa-building" value="OTH"' + (target && target === "OTH" ? 'selected' : '') + '>OTH</option>',
                        '<option data-icon="fas fa-times-circle" value="NOT"' + (target && target === "NOT" ? 'selected' : '') + '>NOT</option>',
                        '</select>'].join("");
                },
                events: {
                    'change .selectpicker': function (e, value, row, index) {
                        var valueSelected = $('#target_' + row['ori_id']).selectpicker('val');
                        row['target'] = valueSelected;
                        update_samples(row, e);
                    }
                }
            },
            {
                field: 'type',
                title: 'Type',
                align: 'center',
                valign: 'middle',
                width: 100,
                formatter: function (value, row, index) {
                    var offensive = row['offensive'];
                    var type = row['type'];
                    return ['<select class="selectpicker" id="type_' + row['ori_id'] + '" ' + (offensive && offensive === 'OFF' ? '' : 'disabled') + ' data-style="btn-warning" title="Type" data-width="fit">',
                        '<option data-icon="far fa-meh-blank" value="RAC"' + (type && type === "RAC" ? 'selected' : '') + '>RAC</option>',
                        '<option data-icon="fas fa-venus-mars" value="SEX"' + (type && type === "SEX" ? 'selected' : '') + '>SEX</option>',
                        '<option data-icon="fas fa-frown-open" value="PAT"' + (type && type === "PAT" ? 'selected' : '') + '>PAT</option>',
                        '<option data-icon="fas fa-crow" value="OTH"' + (type && type === "OTH" ? 'selected' : '') + '>OTH</option>',
                        '</select>'].join("");
                },
                events: {
                    'change .selectpicker': function (e, value, row, index) {
                        var valueSelected = $('#type_' + row['ori_id']).selectpicker('val');
                        row['type'] = valueSelected;
                        update_samples(row, e);
                    }
                }
            }
        ]
    });
}

function update_samples(data, event) {
    $.ajax({
        type: "post",
        url: '/update',
        async: false,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            if (result['result'] === 'fail') {
                alert(result['error']);
            } else {
                status = result['status'];
                $(event.currentTarget).closest('tr').children('td').each(function () {
                    switch (status) {
                        case '-1':
                            $(this).css('background-color', '#f4e7e6');
                            break;
                        case '0':
                            $(this).css('background-color', '#fcf8e3');
                            break;
                        case '1':
                            $(this).css('background-color', '#dff0d8');
                            break;
                    }
                });
            }
        }
    });
}

$(function () {
    initTable();

    $('#modal').on('show.bs.modal', function () {
        var $this = $(this);
        var $modal_dialog = $this.find('.modal-dialog');
        $this.css('display', 'block');
        $modal_dialog.css({'margin-top': Math.max(0, ($(window).height() - $modal_dialog.height()) / 2)});
    });
});