from multiprocessing.pool import ThreadPool
from base.base_func import print_log_info
from .data_utils import get_or_create_dic
from .loop_decorator import loop_mdict_list, innerObject
from .init_utils import init_vars
from .mdict_config import get_cpunum
from .multi_base import multi_search_mdx


def multithread_search_sug(n, query_list, group):
    return multi_search_mdx(n, query_list, group, is_mdx=False)


def multithread_search_mdx(n, query, group):
    return multi_search_mdx(n, query, group)


def create_thread_pool():
    cnum = get_cpunum()
    print_log_info(['creating multithreading pool. thread number is ', cnum, '.'])
    return ThreadPool(cnum)


def terminate_threadpool(threadpool):
    print_log_info('terminating multithreading pool.')
    threadpool.terminate()


def check_threadpool_recreate(threadpool):
    # 重建进程池
    if init_vars.need_recreate:
        terminate_threadpool(threadpool)
        threadpool = create_thread_pool()
        print_log_info('recreating multithreading pool success.')
        init_vars.need_recreate = False
    return threadpool


@loop_mdict_list()
class loop_create_model_object(innerObject):
    def inner_search(self, mdx, mdd_list, g_id, icon, dict_file, dic):
        get_or_create_dic(dict_file)


def loop_create_thread_model():
    global thpool
    terminate_threadpool(thpool)
    loop_create_model_object({})
    thpool = create_thread_pool()


# thpool = create_thread_pool()