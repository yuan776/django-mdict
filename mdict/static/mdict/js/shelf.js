var script=`
<script src='/static/mdict/iframe-resizer/js/iframeResizer.contentWindow.min.js'></script>
`;

function start_modal(obj){
    var dic_pk=$(obj).attr('data-pk');
    $("#modal-shelf-dic").attr('data-pk',dic_pk);
    var dic_name=$(obj).attr('data-name');
    get_header($("#modal-shelf-dic .modal-body"),dic_pk,dic_name);
}


function get_items(container){
	$.ajax({
		url:"/mdict/mdictlist/",
		contentType:'json',
		type:'GET',
		success:function(data){
			var d=$.parseJSON(data);
			for(var i=0;i<d.length;i++){
				var dic_name=d[i]["dic_name"];
				var dic_file=d[i]["dic_file"];
				var dic_icon=d[i]["dic_icon"];
				var dic_pror=d[i]["dic_pror"];
				var dic_pk=d[i]["dic_pk"];
				var dic_enable=d[i]["dic_enable"];
				var dic_es_enable=d[i]["dic_es_enable"]
				var dic_type=d[i]["dic_type"];

                var s=`
                <div class="col">
                    <div class="card shadow" title="${html_escape(dic_name)}" data-pk=${dic_pk} data-name="${html_escape(dic_name)}" onclick="start_modal(this)">
                        <div class="card-body text-center">
                            <img class="" src="${html_escape(dic_icon,false)}"></img>
                            <div class="card-title" data-file=${html_escape(dic_file)}><b class="text-primary">${dic_pror}</b>&nbsp;${html_escape(dic_name)}</div>
                        </div>
                    </div>
                </div>
                `

				container.append(s);
			}
			set_dic_num();
		},
		error:function(jqXHR,textStatus,errorThrown){
			alert(jqXHR.responseText);
		},
	});
}

function get_header(container, dic_pk, dic_name){
	container.empty();

	$('#modal-shelf-dic-title').text(dic_name);

	var data={"dic_pk":dic_pk,"is_dic":false};
	$.ajax({
		url:"/mdict/header/",
		contentType:'json',
		data:data,
		type:'GET',
		success:function(data){
			var d=$.parseJSON(data);
			var header=d['header'];
			var num=d['num_entrys'];
			var mdx_path=d['mdx_path'];
			var mdd_path=d['mdd_path'];

			var h_line="<div style='width:100%;height:1px;border:0;margin-top:1em;margin-bottom:1em;background-color:gray;'></div>";
			var title="";
			var description="";
			var num_entrys="词条数量："+thousands(num);
			var other_attributes="";
			for(var key in header){
				if(key!="StyleSheet"&&header[key].length>0){//不显示StyleSheet属性和空属性
					if(key=="Title"){
						if(header[key]!=''){
						    title=`<div style="font-size:22px;color:brown;">${header[key]}</div>`;
						}
					}else if(key=="Description"){
						if(header[key]!=''){
						    description=`<div>${header[key]}</div>`;
						}
					}else{
						other_attributes+=`<div>${key}：${header[key]}</div>`;
					}

				}
			}

			var file_info=`<div>${mdx_path}</div><div>${mdd_path}</div>`

//			description=description.replace('height="100%"','').replace("heigth='100%'",'');

			var style="<style>html,body{margin:0;padding:0;}img{max-width:100%;}</style>";

			if(title==''){
			    var html=style;
			}else{
			    var html=style+title;
			}

			if(description==''){
			    html+=h_line+num_entrys;
			}else{
			    html+=h_line+num_entrys+h_line+description;
			}
			html+=h_line+file_info+h_line+other_attributes+script;

			var iframe = document.createElement('iframe');
			iframe.width="100%";
			iframe.height="100%";
			iframe.id="dic-header";
			iframe.scrolling="no";
			container.append(iframe);

			iframe.contentWindow.document.open();
			iframe.contentWindow.document.write(html);//这里用iframe是因为某些字典的description中含有body样式，导致样式污染。
			iframe.contentWindow.document.close();
            iFrameResize({
                log:false,
                checkOrigin:false,
                resizeFrom:'child',
                heightCalculationMethod:'documentElementOffset',
                warningTimeout:0,
            },iframe);
            var modal_shelf_dic = new bootstrap.Modal(document.getElementById('modal-shelf-dic'), {});
            modal_shelf_dic.show();

		},
		error:function(jqXHR,textStatus,errorThrown){
			alert(jqXHR.responseText);
		},
	});
}

function shelf_dic_btn(type){
    var dic_pk=$("#modal-shelf-dic").attr('data-pk');
    if(type==0){
        window.open('/mdict/dic/'+dic_pk+'/');
    }else if(type==1){
        window.open('/mdict/esdic/'+dic_pk+'/');
    }else{
        window.open('/admin/mdict/mdictdic/'+dic_pk+'/');
    }
}

function set_dic_num(){
    $("#dic-num").text($(".col:visible").length);
}

function start_dic_filter(group_pk){
    data={"dic_group":group_pk};
    $.ajax({
		url:"/mdict/getpkingroup/",
		contentType:'json',
		type:'GET',
		data:data,
		success:function(data){
		var pk_list=$.parseJSON(data);
		var mdict_list=$(".col");
		if(pk_list.length==0&&group_pk<=0){
		    $(mdict_list).each(function(){$(this).show();});
		    set_dic_num()
		}else{
            for(var i=0;i<mdict_list.length;i++){
                var dic_pk=parseInt($(mdict_list[i]).children('.card').attr('data-pk'));
                var pk_pos=$.inArray(dic_pk,pk_list);
                if(pk_pos<0){
                    $(mdict_list[i]).hide();
                }else{
                    $(mdict_list[i]).show();
                }
            }
		    set_dic_num()
        }

		},
		error:function(jqXHR,textStatus,errorThrown){
			alert(jqXHR.responseText);
		},
	});
}

function init_dropdown(){
	$.ajax({
		url:"/mdict/dicgroup/",
		contentType:'json',
		type:'GET',
		async:false,
		success:function(data){
		var dic_group=$.parseJSON(data);
		for(var i=0;i<dic_group.length;i++){
			var ele='<li onclick="start_dic_filter('+dic_group[i][0]+')"><span class="dropdown-item" data-pk='+dic_group[i][0]+'>'+dic_group[i][1]+'</span></li>'
			$('#dic-group').append($(ele));
		}
		},
		error:function(jqXHR,textStatus,errorThrown){
			alert(jqXHR.responseText);
		},
	});
}

function init_mdict_filter(){
    $("#mdict-filter-input").bind("input propertychange",function(event){
        //juery的change事件，只有当input没有聚焦的时候才能触发，input propertychange能检测input输入过程中的变化
        var txt=$.trim($(this).val().toLowerCase( ));
        var mdict_list=$(".col");
        if(txt.length>0){
//延时有问题
            last =  event.timeStamp;
            //利用event的timeStamp来标记时间，这样每次事件都会修改last的值，注意last必需为全局变量
            setTimeout(function(){    //设时延迟0.5s执行
                if(last-event.timeStamp==0)
                //如果时间差为0（也就是你停止输入0.5s之内都没有其它的keyup事件发生）则做你想要做的事
                {

                    for(var i=0;i<=mdict_list.length;i++){
                        var dic_a=$(mdict_list[i]).find('.card-title');
                        var title=dic_a.text().toLowerCase();
                        if(title=="")continue;
                        var file=dic_a.attr('data-file').toLowerCase();

                        if(t2s(title).indexOf(txt)==-1&&s2t(title).indexOf(txt)==-1&&t2s(file).indexOf(txt)==-1&&s2t(file).indexOf(txt)==-1){
                            $(mdict_list[i]).hide();
                        }else{
                            $(mdict_list[i]).show();
                        }
                    }
                }
                set_dic_num();
            },500);
        }else{
           last =  event.timeStamp;
           setTimeout(function(){//这里也要定时，否则在手机上，这里运行快，上面延时，快速删除时，显示结果不对
               for(var i=0;i<=mdict_list.length;i++){
                    $(mdict_list[i]).show();
               }
               set_dic_num();
           },500);
        }

    })
}