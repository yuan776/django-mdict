from .mdict_config import get_config_con
from .data_utils import get_or_create_dic, get_all_dic
from .init_utils import init_vars, indicator
from .search_object import SearchObject
from .mdict_func import get_dic_attrs

from .entry_object import EntryObject
from mdict.models import MdictDicGroup

values_dict = init_vars.mdict_odict

dics_list = get_all_dic()


def merge_record(record_list):
    # 多于1个的词条进行合并，比如国家教育研究院双语词汇双向词典，该词典查variation有27个词条。
    # 长度小于500才合并，原因是英和中词典的a词条都合并起来，特别特别长，iframe展开时，台式机要卡住好长时间才能显示
    merge_entry_max_length = get_config_con('merge_entry_max_length')

    if merge_entry_max_length == 0:
        return record_list

    t_list = []
    name = ''
    entry = ''
    record = ''
    pror = 1
    counter = 0

    del_list = []
    del_item = []
    old_mdx_pk = 0
    for i in range(len(record_list) - 1, -1, -1):
        item = record_list[i]
        mdx_name = item.mdx_name
        mdx_entry = item.mdx_entry
        mdx_record = item.mdx_record
        mdx_pror = item.mdx_pror
        mdx_pk = item.pk

        if name == '':
            name = mdx_name

        if mdx_name == name:
            if len(mdx_record) < merge_entry_max_length:
                if mdx_entry.strip() not in entry:
                    entry = entry + '｜' + mdx_entry
                record = record + '<br/>' + mdx_record
                pror = mdx_pror
                counter += 1
                old_mdx_pk = mdx_pk
                del_item.append(i)
        else:
            if counter > 1:
                entry = entry[1:] + '【' + str(counter) + '】'
                t_list.append(EntryObject(name, entry, record, pror, old_mdx_pk, -1, -1, -1))
                del_list.append(del_item.copy())

            name = mdx_name
            entry = '/' + mdx_entry
            record = mdx_record
            pror = mdx_pror
            counter = 1

            del_item.clear()
            del_item.append(i)

        if i == 0:
            if counter > 1:
                entry = entry[1:] + '【' + str(counter) + '】'
                t_list.append(EntryObject(name, entry, record, pror, old_mdx_pk, -1, -1, -1))
                del_list.append(del_item.copy())

    for item in del_list:
        for i in item:
            del record_list[i]

    record_list.extend(t_list)
    return record_list


def multi_search_mdx(n, query_list, group, is_mdx=True):
    r_list = []
    for k in indicator[n]:
        temp_object = values_dict[k]
        mdx = temp_object.mdx
        mdd_list = temp_object.mdd_list
        g_id = temp_object.g_id
        dict_file = mdx.get_fname()

        dic_list = dics_list.filter(mdict_file=dict_file)
        if len(dic_list) == 0:
            dic = get_or_create_dic(dict_file)
        else:
            dic = dic_list[0]

        if dic.mdict_enable:
            if group == 0:  # 默认查询全部词典
                if is_mdx:
                    r_list.extend(SearchObject(mdx, mdd_list, get_dic_attrs(dic), query_list, g_id=g_id).search_entry_list())
                else:
                    r_list.extend(SearchObject(mdx, mdd_list, get_dic_attrs(dic), query_list).search_sug_list(3))
            else:  # 查询某个词典分组下的词典
                group_list = MdictDicGroup.objects.filter(pk=group)
                if len(group_list) > 0:
                    temp = group_list[0].mdict_group.filter(pk=dic.pk)
                    if len(temp) > 0:
                        if is_mdx:
                            r_list.extend(SearchObject(mdx, mdd_list, get_dic_attrs(dic), query_list, g_id=g_id).search_entry_list())
                        else:
                            r_list.extend(SearchObject(mdx, mdd_list, get_dic_attrs(dic), query_list).search_sug_list(3))

    if is_mdx:
        r_list = merge_record(r_list)
    return r_list