import React, {Component} from 'react'
import {
  CameraRoll,
  StyleSheet,
  View,
  Text,
  ListView,
  ActivityIndicator,
  Platform
} from 'react-native'
import ImagePicker from 'react-native-image-picker'
import ImageItem from './ImageItem'
import PickerButtonItem from './PickerButtonItem'

type ImageObject = {
  filename: string,
  uri: string,
  height: number,
  width: number,
  mimeType: string,
  type: string
}

class CameraRollPicker extends Component {
  constructor (props) {
    super(props)

    this.state = {
      images: [],
      selected: this.props.selected,
      lastCursor: null,
      loadingMore: false,
      noMore: false,
      dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    }
  }

  componentWillMount () {
    this.fetch()
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      selected: nextProps.selected
    })
  }

  fetch () {
    if (!this.state.loadingMore) {
      this.setState({loadingMore: true}, () => { this._fetch() })
    }
  }

  _fetch () {
    var {groupTypes, assetType} = this.props

    var fetchParams = {
      first: 1000,
      groupTypes: groupTypes,
      assetType: assetType
    }

    if (Platform.OS === 'android') {
      // not supported in android
      delete fetchParams.groupTypes
    }

    if (this.state.lastCursor) {
      fetchParams.after = this.state.lastCursor
    }

    CameraRoll.getPhotos(fetchParams)
      .then((data) => {
      this._appendImages(data)
    },
    (e) => {
      this.setState({
        loadingMore: false
      })
      console.warn(e)
    })
  }

  _appendImages (data) {
    var assets = data.edges
    var newState = {
      loadingMore: false
    }

    if (!data.page_info.has_next_page) {
      newState.noMore = true
    }

    if (assets.length > 0) {
      newState.lastCursor = data.page_info.end_cursor
      newState.images = this.state.images.concat(assets)
      newState.dataSource = this.state.dataSource.cloneWithRows(
        this._nEveryRow(newState.images, this.props.imagesPerRow)
      )
    }

    this.setState(newState)
  }

  render () {
    var {
      dataSource,
      loadingMore
    } = this.state
    var {
      scrollRenderAheadDistance,
      initialListSize,
      pageSize,
      removeClippedSubviews,
      backgroundColor,
      emptyText,
      emptyTextStyle,
      tintColor
    } = this.props

    return (
      <View
        style={[styles.wrapper, {padding: 0, backgroundColor: backgroundColor}]}>
        {dataSource.getRowCount() > 0 ? (
          <ListView
            style={{flex: 1}}
            scrollRenderAheadDistance={scrollRenderAheadDistance}
            initialListSize={initialListSize}
            pageSize={pageSize}
            removeClippedSubviews={removeClippedSubviews}
            renderFooter={this._renderFooterSpinner.bind(this)}
            onEndReached={this._onEndReached.bind(this)}
            dataSource={dataSource}
            renderRow={rowData => this._renderRow(rowData)} />
        ) : (
          <View style={{flex: 1, alignItems:'center', justifyContent:'center'}}>
            {loadingMore ? (
              <ActivityIndicator
                size={'large'}
                style={{margin: 16}}
                color={tintColor}
                animating
                hidesWhenStopped
              />
            ) : (
              <Text style={[{textAlign: 'center', color: tintColor}, emptyTextStyle]}>{emptyText}</Text>
            )}
          </View>
        )}
      </View>
    )
  }

  _naiveGetMimeType (image : ImageObject) {
    try {
      let ext = image.uri.substr(image.uri.lastIndexOf('.') + 1).toLowerCase()
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg'
        case 'png':
          return 'image/png'
        case 'gif':
          return 'image/gif'
        default:
          return 'image/jpeg'
      }

    } catch (err) {
      console.error(err);
      return 'image/jpeg'
    }
  }

  _renderPickerButton (item) {
    var {
      imageMargin,
      imagesPerRow,
      containerWidth,
      cameraText,
      albumText,
      tintColor
    } = this.props

    var source = null
    var text = ''
    switch (item) {
      case 'Camera':
        source = require('./img/ic_camera_black_48dp.png')
        text = cameraText
        break
      default:
      case 'Album':
        source = require('./img/ic_picture_black_48dp.png')
        text = albumText
        break
    }
    return (
      <PickerButtonItem
        key={item}
        item={item}
        source={source}
        text={text}
        imageMargin={imageMargin}
        imagesPerRow={imagesPerRow}
        containerWidth={containerWidth}
        tintColor={tintColor}
        onClick={this._onPickerItemClick.bind(this)}
      />
    )
  }

  _renderImage (item) {
    var {selected} = this.state
    var {
      imageMargin,
      selectedMarker,
      imagesPerRow,
      containerWidth,
      maximum
    } = this.props

    var uri = item.node.image.uri
    var isSelected = (this._arrayObjectIndexOf(selected, 'uri', uri) >= 0) && maximum > 1

    return (
      <ImageItem
        key={uri}
        item={item}
        selected={isSelected}
        imageMargin={imageMargin}
        selectedMarker={selectedMarker}
        imagesPerRow={imagesPerRow}
        containerWidth={containerWidth}
        onClick={this._selectImage.bind(this)}
      />
    )
  }

  _renderRow (rowData) {
    var items = rowData.map((item) => {
      if (item === null) {
        return null
      }
      if (item === 'Camera' || item === 'Album') {
        return this._renderPickerButton(item)
      }
      return this._renderImage(item)
    })

    return (
      <View style={styles.row}>
        {items}
      </View>
    )
  }

  _renderFooterSpinner () {
    if (!this.state.noMore) {
      return <ActivityIndicator style={styles.spinner} />
    }
    return null
  }

  _onEndReached () {
    if (!this.state.noMore) {
      this.fetch()
    }
  }

  _selectImage (image) {
    var {maximum, imagesPerRow, onPick} = this.props

    var selected = this.state.selected
    var index = this._arrayObjectIndexOf(selected, 'uri', image.uri)

    if (index >= 0) {
      selected.splice(index, 1)
    } else {
      if (selected.length < maximum) {
        selected.push(image)
      }
    }

    this.setState({
      selected: selected,
      dataSource: this.state.dataSource.cloneWithRows(
        this._nEveryRow(this.state.images, imagesPerRow)
      )
    })

    onPick(this.state.selected, image)

    this._resizeImage(image.uri)
  }

  _nEveryRow (data, n) {
    var result = []
    var temp = []

    for (var i = 0; i < this.props.pickerButtonTypes.length; ++i) {
      if (this.props.pickerButtonTypes[i] === 'Camera') {
        temp.push('Camera')
      }
      if (this.props.pickerButtonTypes[i] === 'Album') {
        temp.push('Album')
      }
    }

    var initialIndex = temp.length

    for (i = 0; i < data.length; ++i) {
      var index = i + initialIndex
      if (index > 0 && index % n === 0) {
        result.push(temp)
        temp = []
      }
      temp.push(data[i])
    }
    if (temp.length > 0) {
      while (temp.length !== n) {
        temp.push(null)
      }
      result.push(temp)
    }
    return result
  }

  _arrayObjectIndexOf (array, property, value) {
    return array.map((o) => { return o[property] }).indexOf(value)
  }

  _onPickerItemClick (item) {
    // const options = {
      // quality: this.props.quality,
      // maxWidth: this.props.maxWidth,
      // maxHeight: this.props.maxHeight
      // storageOptions: {
      //   skipBackup: true
      // }
    // }
    switch (item) {
      case 'Camera': {
        ImagePicker.launchCamera({}, (response) => {
          this._onPickerComplete(response)
        })
      }
        break
      case 'Album': {
        ImagePicker.launchImageLibrary({}, (response) => {
          this._onPickerComplete(response)
        })
      }
        break
      default:
        break
    }
  }

  _onPickerComplete (response) {
    var {onPick} = this.props
    // console.log('Response = ', response)
    if (response.didCancel) {
      console.log('User cancelled photo camera')
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error)
    } else {
      onPick(this.state.selected, this._getImageFromResponse(response))
      this._resizeImage(response.uri)
    }
  }

  _getImageFromResponse (response) {
    var image = {}
    image['isStored'] = true
    image['width'] = response.width
    image['height'] = response.height
    image['filename'] = response.fileName
    // You can display the image using either:
    // source = {uri: 'data:image/jpeg;base64,' + response.data, isStatic: true};
    // Or:
    if (Platform.OS === 'android') {
      image['uri'] = response.uri
    } else {
      if (response.uri) {
        image['uri'] = response.uri.replace('file://', '')
      }
    }

    if (Platform.OS === 'android') {
      image['mimeType'] = response.type
    } else {
      image['mimeType'] = this._naiveGetMimeType(response)
    }
    return image
  }

  _resizeImage (uri) {
    if (this.props.onResize === null) {
      return
    }
    let options = Object.assign({
      maxWidth: this.props.maxWidth,
      maxHeight: this.props.maxHeight,
      quality: this.props.quality
    }, {uri: uri})
    ImagePicker.downscaleImageIfNecessary(options, (response) => {
      if (response.error) {
        console.log('Resize Error: ', response.error)
        this.props.onResize(null)
      } else {
        this.props.onResize(this._getImageFromResponse(response))
      }
    })
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1
  },
  row: {
    flexDirection: 'row',
    flex: 1
  },
  marker: {
    position: 'absolute',
    top: 5,
    backgroundColor: 'transparent'
  }
})

CameraRollPicker.propTypes = {
  scrollRenderAheadDistance: React.PropTypes.number,
  initialListSize: React.PropTypes.number,
  pageSize: React.PropTypes.number,
  removeClippedSubviews: React.PropTypes.bool,
  groupTypes: React.PropTypes.oneOf([
    'Album',
    'All',
    'Event',
    'Faces',
    'Library',
    'PhotoStream',
    'SavedPhotos'
  ]),
  maximum: React.PropTypes.number,
  assetType: React.PropTypes.oneOf([
    'Photos',
    'Videos',
    'All'
  ]),
  imagesPerRow: React.PropTypes.number,
  imageMargin: React.PropTypes.number,
  containerWidth: React.PropTypes.number,
  onPick: React.PropTypes.func,
  onResize: React.PropTypes.func,
  selected: React.PropTypes.array,
  selectedMarker: React.PropTypes.element,
  backgroundColor: React.PropTypes.string,
  emptyText: React.PropTypes.string,
  emptyTextStyle: Text.propTypes.style,
  pickerButtonTypes: React.PropTypes.arrayOf(
    React.PropTypes.string // 'Camera', 'Album'
  ),
  tintColor: React.PropTypes.string,
  quality: React.PropTypes.number,
  maxWidth: React.PropTypes.number,
  maxHeight: React.PropTypes.number
}

CameraRollPicker.defaultProps = {
  scrollRenderAheadDistance: 500,
  initialListSize: 1,
  pageSize: 3,
  removeClippedSubviews: true,
  groupTypes: 'SavedPhotos',
  maximum: 15,
  imagesPerRow: 3,
  imageMargin: 5,
  assetType: 'Photos',
  backgroundColor: 'white',
  selected: [],
  onPick: function (selectedImages, currentImage) {
    console.log(currentImage)
    console.log(selectedImages)
  },
  onResize: null,
  emptyText: 'No photos.',
  cameraText: 'Camera',
  albumText: 'All Photos',
  pickerButtonTypes: ['Camera', 'Album'],
  tintColor: 'rgba(0,0,0,0.4)',
  quality: 1.0,
  maxWidth: 1280,
  maxHeight: 1280
}

export default CameraRollPicker
