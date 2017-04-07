import React, {Component} from 'react'
import {
  CameraRoll,
  StyleSheet,
  View,
  Text,
  ListView,
  ActivityIndicator,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  AppState
} from 'react-native'
import ImagePicker from 'react-native-image-picker'
import ImageItem from './ImageItem'
import PickerButtonItem from './PickerButtonItem'
import Permissions from 'react-native-permissions'

type ImageObject = {
  filename: string,
  uri: string,
  height: number,
  width: number,
  mimeType: string,
  type: string,
  imageSource: string
}

const ErrorCode = {
  ErrorTooLarge: 'TooLarge',
  ErrorTooSmall: 'TooSmall',
  ErrorTooLong: 'TooLong'
}

const ImageSource = {
  SourcePicker: 'Picker',
  SourceAlbum: 'Album',
  SourceCamera: 'Camera'
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
      dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
      permissionStatus: {
        photo: 'undetermined', //one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        camera: 'undetermined'
      }
    }
  }

  componentWillMount () {
    this.fetch()
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange.bind(this));
  }

  componentDidMount () {
    this._updatePermissions()
    AppState.addEventListener('change', this._handleAppStateChange.bind(this));
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
    const {
      dataSource
    } = this.state
    const {
      scrollRenderAheadDistance,
      initialListSize,
      pageSize,
      removeClippedSubviews,
      backgroundColor,
    } = this.props

    return (
      <View
        style={[styles.wrapper, {backgroundColor: backgroundColor}]}>
        {dataSource.getRowCount() > 0 ? (
          <ListView
            style={styles.listView}
            scrollRenderAheadDistance={scrollRenderAheadDistance}
            initialListSize={initialListSize}
            pageSize={pageSize}
            removeClippedSubviews={removeClippedSubviews}
            renderFooter={this._renderFooterSpinner.bind(this)}
            onEndReached={this._onEndReached.bind(this)}
            dataSource={dataSource}
            renderRow={rowData => this._renderRow(rowData)} />
        ) : (
          this._renderEmptyOrLoading()
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

  _renderLoading () {
    const {
      tintColor
    } = this.props

    return (
      <ActivityIndicator
        size={'large'}
        color={tintColor}
        animating
        hidesWhenStopped
      />
    )
  }

  _renderEmpty () {
    const {
      emptyText,
      emptyTextStyle,
      tintColor
    } = this.props

    return (
      <Text style={[{color: tintColor}, styles.text, emptyTextStyle]}>
        { emptyText }
      </Text>
    )
  }

  _renderNoPermission () {
    const {
      emptyTextStyle,
      noPhotoPermissionText,
      noPhotoPermissionButtonText,
      tintColor,
      accentColor
    } = this.props

    // <Text style={styles.text}>Open settings</Text>

    return (
        <View>
          <Text style={[{color: tintColor}, styles.text, emptyTextStyle]}>
            { noPhotoPermissionText }
          </Text>
          <TouchableWithoutFeedback onPress={ Permissions.openSettings }>
            <Text style={[{color: accentColor}, styles.text, emptyTextStyle]}>
              { noPhotoPermissionButtonText }
            </Text>
          </TouchableWithoutFeedback>
      </View>
    )
  }

  _renderEmptyOrLoading () {
    const {
      loadingMore
    } = this.state
    const hasPhotoPermission = this.state.permissionStatus.photo === 'authorized'

    return (
      <View style={styles.emptyContainer}>
        {loadingMore ? (
          this._renderLoading()
        ) : (
          !hasPhotoPermission ? (
            this._renderNoPermission()
          ) : (
            this._renderEmpty()
          )
        )}
      </View>
    )
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

    this._resizeImage(image.uri, ImageSource.SourcePicker)
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
    switch (item) {
      case 'Camera': {
        // For now, since Android is not using any in app camera
        Permissions.requestPermission(Platform.OS === 'android' && this.props.androidOverrideCameraPermissionWithPhotoPermission ? 'photo' : 'camera')
          .then(res => {
            this.setState({
              permissionStatus: {...this.state.permissionStatus, ['camera']: res}
            })

            const {
              noPermissionAlertTitle,
              noCameraPermissionText,
              noCameraPermissionButtonText,
              cancelText
            } = this.props

            if (res !== 'authorized') {
              Alert.alert(
                noPermissionAlertTitle,
                noCameraPermissionText,
                [
                  { text: cancelText, style: 'cancel' },
                  { text: noCameraPermissionButtonText, onPress: Permissions.openSettings },
                ]
              )
            } else {
              ImagePicker.launchCamera({}, (response) => {
                this._onPickerComplete(response, ImageSource.SourceCamera)
              })
            }
          }).catch(e => console.warn(e))
      }
        break
      case 'Album': {
        ImagePicker.launchImageLibrary({}, (response) => {
          this._onPickerComplete(response, ImageSource.SourceAlbum)
        })
      }
        break
      default:
        break
    }
  }

  _onPickerComplete (response, imageSource) {
    var {onPick} = this.props
    // console.log('Response = ', response)
    if (response.didCancel) {
      console.log('User cancelled photo camera')
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error)
    } else {
      const image = this._getImageFromResponse(response, imageSource)
      onPick(this.state.selected, image)
      this._resizeImage(response.uri, imageSource)
    }
  }

  _getImageFromResponse (response, imageSource): ImageObject {
    var image = {}
    image['isStored'] = true
    image['width'] = response.width
    image['height'] = response.height
    image['filename'] = response.fileName
    image['imageSource'] = imageSource
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

  _resizeImage (uri: string, imageSource: string) {
    if (this.props.onResize === null) {
      return
    }
    var options = {
      uri: uri,
      quality: this.props.quality,
    }
    if (this.props.resizeToMaxWidth) {
      options = Object.assign(options, { maxWidth: this.props.resizeToMaxWidth })
    }
    if (this.props.resizeToMaxHeight) {
      options = Object.assign(options, { maxHeight: this.props.resizeToMaxHeight })
    }

    ImagePicker.downscaleImageIfNecessary(options, (response) => {
      if (response.error) {
        console.log('Resize Error: ', response.error)
        this.props.onResize(response.error, null)
      } else {
        const image = this._getImageFromResponse(response, imageSource)
        this._validateImageDimension(image)
          .then(result => {
            this.props.onResize(null, image)
          })
          .catch(error => {
            this.props.onResize(error, image)
          })
      }
    })
  }

  _validateImageDimension (image) {
    const {
      minWidth,
      minHeight,
      resizedMaxWidth,
      resizedMaxHeight,
      maxPixelDimension,
      maxHeightToWidthRatio
    } = this.props

    return new Promise((resolve, reject) => {
      if (resizedMaxHeight && image.height > resizedMaxHeight) {
        return reject(ErrorCode.ErrorTooLarge)
      }
      if (resizedMaxWidth && image.width > resizedMaxWidth) {
        return reject(ErrorCode.ErrorTooLarge)
      }
      if (image.width * image.height > maxPixelDimension) {
        return reject(ErrorCode.ErrorTooLarge)
      }
      if (image.height / image.width > maxHeightToWidthRatio) {
        return reject(ErrorCode.ErrorTooLong)
      }
      if (image.width < minWidth || image.height < minHeight) {
        return reject(ErrorCode.ErrorTooSmall)
      }
      return resolve(image)
    })
  }

  //update permissions when app comes back from settings
  _handleAppStateChange (appState) {
    if (appState === 'active') {
      this._updatePermissions()
    }
  }

  _updatePermissions () {
    Permissions.checkMultiplePermissions(['photo', 'camera'])
      .then(status => {
        this.setState({ permissionStatus: status})
      })
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 0
  },
  listView: {
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
  },
  emptyContainer: {
    flex: 1,
    alignItems:'center',
    justifyContent:'center'
  },
  text: {
    textAlign: 'center'
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
  cancelText: React.PropTypes.string,
  noPermissionAlertTitle: React.PropTypes.string,
  noPhotoPermissionText: React.PropTypes.string,
  noPhotoPermissionButtonText: React.PropTypes.string,
  noCameraPermissionText: React.PropTypes.string,
  noCameraPermissionButtonText: React.PropTypes.string,
  emptyText: React.PropTypes.string,
  emptyTextStyle: Text.propTypes.style,
  pickerButtonTypes: React.PropTypes.arrayOf(
    React.PropTypes.string // 'Camera', 'Album'
  ),
  tintColor: React.PropTypes.string,
  accentColor: React.PropTypes.string,
  quality: React.PropTypes.number,
  minWidth: React.PropTypes.number,
  minHeight: React.PropTypes.number,
  resizeToMaxWidth: React.PropTypes.number,
  resizeToMaxHeight: React.PropTypes.number,
  resizedMaxWidth: React.PropTypes.number,
  resizedMaxHeight: React.PropTypes.number,
  maxPixelDimension: React.PropTypes.number,
  maxHeightToWidthRatio: React.PropTypes.number,
  androidOverrideCameraPermissionWithPhotoPermission: React.PropTypes.bool
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
  noPermissionAlertTitle: 'Whoops!',
  noPhotoPermissionText: 'No photo access permission. Please enable it from Settings.',
  noPhotoPermissionButtonText: 'Open Settings',
  noCameraPermissionText: 'No camera access permission. Please enable it from Settings.',
  noCameraPermissionButtonText: 'Open Settings',
  cancelText: 'Cancel',
  emptyText: 'No photos.',
  cameraText: 'Camera',
  albumText: 'All Photos',
  pickerButtonTypes: ['Camera', 'Album'],
  tintColor: 'rgba(0,0,0,0.4)',
  accentColor: '#0088ff',
  quality: 1.0,
  minWidth: 200,
  minHeight: 100,
  resizeToMaxWidth: 1280,
  resizeToMaxHeight: null,
  resizedMaxWidth: null,
  resizedMaxHeight: 25000,
  maxPixelDimension: 100000000,
  maxHeightToWidthRatio: 15000.0 / 460.0,
  // If there's no in-app camera, Android is able to launch camera without camera permission
  // This is to avoid asking excessive permissions
  androidOverrideCameraPermissionWithPhotoPermission: false
}

export default CameraRollPicker
