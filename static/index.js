function init_table() {
    var page_list = [50, 100, 500, 1000, 5000, 10000];
    $('#table').bootstrapTable('destroy');
    $('#table').bootstrapTable({
        // data: getSamples(),
        method: "get",
        url: $('#prefix').val() + '/samples',
        toolbar: "#toolbar",
        sidePagination: "true",
        striped: true,
        uniqueId: "ori_id",
        pageSize: page_list[0],
        pageList: page_list,
        pagination: true,
        paginationShowPageGo: true,
        sortable: false,
        striped: true,
        sidePagination: 'client',
        showRefresh: true,
        pageNumber: 1,
        showExport: true,
        queryParams: {
            'is_sample': $('#is_sample').val(),
            'total': $('#total').val(),
            'number': $('#number').val()
        },
        queryParamsType: 'limit',
        exportDataType: 'all',
        exportTypes: ['excel', 'json', 'csv'],
        exportOptions: {
            fileName: 'twitch_annotation_data',
            onCellHtmlData: do_on_cell_html_data
            // onCellData: do_on_cell_data
        },
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
                title: 'Post',
                // align: 'center',
                valign: 'middle'
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
                    return ['<select class="selectpicker pull-left" id="offensive_' + row['ori_id'] + '" data-style="btn-primary" title="Offensive" data-width="fit">',
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
                titleTooltip: 'Does it has a target?',
                align: 'center',
                valign: 'middle',
                width: 100,
                formatter: function (value, row, index) {
                    var offensive = row['offensive'];
                    var target = row['target'];
                    return ['<select class="selectpicker pull-left" id="target_' + row['ori_id'] + '" ' + (offensive && offensive === 'OFF' ? '' : 'disabled') + ' data-style="btn-success" title="Target" data-width="fit">',
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
                titleTooltip: 'What type is it?',
                align: 'center',
                valign: 'middle',
                width: 100,
                formatter: function (value, row, index) {
                    var offensive = row['offensive'];
                    var type = row['type'];
                    return ['<select class="selectpicker pull-left" id="type_' + row['ori_id'] + '" ' + (offensive && offensive === 'OFF' ? '' : 'disabled') + ' data-style="btn-warning" title="Type" data-width="fit">',
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
            },
            {
                field: 'notes',
                title: 'Notes',
                align: 'center',
                valign: 'middle',
                width: 200,
                formatter: function (value, row, index) {
                    var ori_id = row['ori_id'];
                    var notes = row['notes'];
                    if (typeof (notes) === 'undefined' || notes === 'null') {
                        notes = '';
                    }
                    return ['<div class="input-group">',
                        '<input type="text" class="form-control" id="notes_' + row['ori_id'] + '" placeholder="" value="' + notes + '"  onkeydown="on_key_down(event, \'' + ori_id + '\')" >',
                        '<div class="input-group-append">',
                        '<button type="button" onclick="update_notes(\'' + ori_id + '\')" class="btn btn-sm btn-info"><i class="fa fa-check"></i></button>',
                        '</div></div>'].join("");
                }
            }
        ]
    });
}

function update_samples(data, event) {
    $.ajax({
        type: "post",
        url: $('#prefix').val() + "/update",
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

function do_on_cell_html_data(cell, row, col, data) {
    if (row > 0 && (col === 2 || col === 3 || col === 4)) {
        const regex = /.*selected.+?>([a-zA-Z]+?)<.*/gm;
        const subst = `$1`;
        const result = data.replace(regex, subst);
        if (typeof (result) != 'undefined' && result.length <= 10) {
            return result;
        } else {
            return '';
        }
    }
    if (row > 0 && col === 5) {
        const regex = /.*value="(.*?)".*/gm;
        const subst = `$1`;
        const result = data.replace(regex, subst);
        if (typeof (result) != 'undefined' && result.length > 0) {
            return result;
        } else {
            return '';
        }
    }
    return data;
}

function do_on_cell_data(cell, row, col, data) {
    if (row > 0 && (col === 2 || col === 3 || col === 4)) {
        var data_split = data.split(" ");
        console.log(data)
        if (data_split.length > 0 && typeof (data_split[1]) !== "undefined") {
            return data_split[1];
        } else {
            return '';
        }
    }
    return data;
}

function update_notes(ori_id) {
    var notes = $('#notes_' + ori_id).val();
    if (notes.length > 0) {
        var data = {'ori_id': ori_id, 'notes': notes};
        $.ajax({
            type: "post",
            url: $('#prefix').val() + '/notes',
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                if (result['result'] === 'fail') {
                    alert(result['error']);
                } else {
                    $('#table').bootstrapTable('refresh');
                }
            }
        });
    }
}

function on_key_down(e, ori_id) {
    var keyCode = null;
    if(e.which) keyCode = e.which;
    else if(e.keyCode) keyCode = e.keyCode;
    if (keyCode === 13) {
        update_notes(ori_id);
    }
}

$(function () {
    init_table();

    $('#modal').on('show.bs.modal', function () {
        var $this = $(this);
        var $modal_dialog = $this.find('.modal-dialog');
        $this.css('display', 'block');
        $modal_dialog.css({'margin-top': Math.max(0, ($(window).height() - $modal_dialog.height()) / 2)});
    });

});