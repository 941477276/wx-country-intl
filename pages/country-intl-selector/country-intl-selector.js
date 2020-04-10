// pages/country-intl-selector.js
import {countriesData} from './data';
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: [Number, String],
      value: ''
    },
    // 控件是否显示
    visible: {
      type: Boolean,
      value: false
    },
    // 类型，有两种类型，第一种：选择手机号码区号，值为phone;第二种：选择国家，值为country
    type: {
      type: String,
      value: 'phone',
    },
    // 是否显示区号
    showAreaCode: {
      type: Boolean,
      value: true
    },
    // 选中项中右侧 "select" 的文案
    selectedText: {
      type: String,
      value: 'Selected',
    },
    // 是否显示选中项右侧的 "select" 文案
    showSelectedText: {
      type: Boolean,
      value: true
    },
    /* 禁用的国家(可以传递国家名称、国家代码、国家区号)，可以传递字符串也可以传递数组，传递字符串时禁用多个国家使用逗号分隔 */
    disableCountry: {
      type: [String, Array],
      value: []
    },
    // 只显示指定的国家，可以传递字符串也可以传递数组，传递字符串时多个国家使用逗号分隔
    onlyCountry: {
      type: [String, Array],
      value: []
    },
    // 是否可以搜索
    searchAble: {
      type: Boolean,
      value: true
    },
    // 是否只读
    justRead: {
      type: Boolean,
      value: false
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    countryListHeight: 300, // 列表高度
    countryList: countriesData, // 列表数据
    selected: {}, // 选择的国籍
    listVisible: false,
    searchText: ''
  },

  /**
   * 数据监测
   */
  observers: {
    'searchText': function(subfield) {
      this._setCountryList();
    },
    'visible': function (visible){
      if(visible){
        this.setData({
          listVisible: true
        });
        this._setCountryListHeight();
        this._calcSelectedOption();
      }      
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 获取选折的国籍
     */
    getSelected(){
      return this.data.selected;
    },
    /**
     * 获取数组中符合条件的元素的索引
     * @param arr 数组
     * @param fn 一个函数，如果函数返回true，则返回该项的下标，如果没有找到则返回-1
     */
    getIndex(arr, fn) {
      if (!arr || arr.length == 0 || !fn || (typeof fn != "function")) {
        return -1;
      }

      if (arr.findIndex) {
        return arr.findIndex(fn);
      }
      let len = arr.length,
        i = 0,
        index = -1;
      for (; i < len; i++) {
        let item = arr[i];
        if (fn(item, index, arr) === true) {
          index = i;
          break;
        }
      }
      return index;
    },
    // 计算默认选中的值
    _calcSelectedOption () {
      // console.log('计算选择值');
      let props = this.properties;
      let data = this.data;
      let value = props.value;
      let isPhone = props.type.toLowerCase() === 'phone';
      if ((value + '').charAt(0) === '+') {
        value = value.substr(1);
      }
      let item = data.countryList.filter((item) => {
        if (isPhone) {
          return item.dialCode == value;
        } else {
          return item.iso2 == value;
        }
      });
      if (!item || item.length === 0) {
        item = {};
      } else {
        item = item[0] || {};
      }
      if(this.data.selected === item){
        return;
      }
      this.setData({
        selected: item
      });
    },
    // 设置列表高度
    _setCountryListHeight(){
      let query = this.createSelectorQuery();
      query.select('#searchBox').boundingClientRect((res) => {
        // 获取系统信息
        let systemInfo = wx.getSystemInfoSync();
        let height = systemInfo.windowHeight - res.height;
        if(this.data.countryListHeight === height){
          return;
        }
        this.setData({
          countryListHeight: height
        });
        console.log('height', height)
      });
      let res = query.exec();
    },
    // 设置城市列表
    _setCountryList(){
        let countries = countriesData;
        let properties = this.properties;
        let data = this.data;
        let searchText = data.searchText || '';
        let disableCountry = typeof properties.disableCountry === 'string' ? properties.disableCountry.split(',') : properties.disableCountry;
        let onlyCountry = typeof properties.onlyCountry === 'string' ? properties.onlyCountry.split(',') : properties.onlyCountry;
        console.log('onlyCountry', onlyCountry, properties.onlyCountry, this)
        // 根据国家名称或国家代码或国家区号过滤只显示的国家
        if(onlyCountry.length > 0){
          countries = countries.filter(country => {
            let index = this.getIndex(onlyCountry, (item) => {
              let dialCode = item + '';
              if(dialCode.charAt(0) === '+'){
                dialCode = dialCode.replace('+', '');
              }
              return country.name === item || country.dialCode === dialCode || country.iso2 === item;
            });
            return index > -1;
          });
          // console.log('只显示指定国家', countries, onlyCountry)
        }
        // console.log('disableCountry', disableCountry)
        // 根据国家名称或国家代码或国家区号过滤禁用的国家
        if(disableCountry.length > 0){
          countries = countries.filter(country => {
            let index = this.getIndex(disableCountry, (item) => {
              let dialCode = item + '';
              if(dialCode.charAt(0) === '+'){
                dialCode = dialCode.replace('+', '');
              }
              return country.name === item || country.dialCode === dialCode || country.iso2 === item;
            });
            return index === -1;
          });
        }
        console.log('searchText.length', searchText.length)
        if (!properties.searchAble || searchText.length === 0) {
          this.setData({
            countryList: countries
          });
          return;
        }
        // 解决用户输入"+"作为搜索条件时，而导致new RegExp(searchText, 'gi')时将"+"认为是需要一个或多个字符
        searchText = searchText.replace('+', '\\+');
        // 按搜索条件进行查询
        countries =  countries.filter(item => {
          let reg = new RegExp(searchText, 'gi');
          // console.log('reg',reg);
          let nameFlag = reg.test(item.name);
          let dialCodeFlag = reg.test(item.dialCode);
          let iso2Flag = reg.test(item.iso2);
          return nameFlag || dialCodeFlag || iso2Flag;
        });
        this.setData({
          countryList: countries
        });
        console.log('countries', countries)
    },
    // 列表项点击事件
    _countryItemClick (e) {
      console.log(e);
      let target = e.target;
      let data = this.data;
      let props = this.properties;
      let selected;
      if(props.justRead){
        return;
      }
      let iso = target.dataset.iso;
      let index = target.dataset.index;
      if (iso === data.selected.iso2) {
        selected = {};
      } else {
        selected = data.countryList[index];
      }
      // 如果用户点击的是“无数据提示”则select会为undefined
      if(!selected){
        return;
      }

      // 如果是收到把列表显示出来的，则点击后需要收到隐藏
      if (this.isManualShow) {
        this.inputFocused = false;
        this.countryListShow = false;
        this.isManualShow = false;
      }
     // 实现双向数据绑定
      this.setData({
        value: props.type.toLowerCase() === 'phone' ? (selected.dialCode || '') : (selected.iso2 || ''),
        selected: selected,
        visible: false,
        searchText: ''
      });
      console.log('设置value', props.type.toLowerCase() === 'phone' ? (selected.dialCode || '') : (selected.iso2 || ''))
      // 传递事件给父组件
      this.triggerEvent('onchange', selected);
    },
    /**
     * 取消 按钮点击事件
     */
    _handelCancel(){
      this.setData({
        visible: false,
        searchText: ''
      });
    },
  },

  /**
   * 生命周期函数
   */
  lifetimes: {
    attached: function() {
     /* // 在组件实例进入页面节点树时执行
      const query = this.createSelectorQuery();
      query.select('#searchBox').boundingClientRect(function(res){
        res.top // #the-id 节点的上边界坐标（相对于显示区域）
        console.log('元素高度', res.height)
      });
      query.exec();

      
      // 获取系统信息
      wx.getSystemInfo({
        success: function (res) {
          // 获取可使用窗口宽度
          let clientHeight = res.windowHeight;
          // 获取可使用窗口高度
          let clientWidth = res.windowWidth;
          // 算出比例
          let ratio = 750 / clientWidth;
          // 算出高度(单位rpx)
          let height = clientHeight * ratio;
          console.log('窗口高度',clientHeight);
        }
      });
*/


    },
    ready: function(){
      
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
    },
  },
})
