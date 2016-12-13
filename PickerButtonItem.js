
import React, {Component} from 'react'
import {
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  View
} from 'react-native'

class PickerButtonItem extends Component {

  componentWillMount () {
    var {width} = Dimensions.get('window')
    var {imageMargin, imagesPerRow, containerWidth} = this.props
    if (typeof containerWidth !== 'undefined') {
      width = containerWidth
    }
    this._imageSize = (width - (imagesPerRow - 1) * imageMargin) / imagesPerRow
  }

  render () {
    var {item, imageMargin} = this.props
    var source = null
    var text = null
    switch (item) {
      case 'Camera':
        source = require('./img/ic_camera_black_24dp.png')
        text = 'Camera'
        break
      default:
      case 'Album':
        source = require('./img/ic_picture_black_24dp.png')
        text = 'All Photos'
        break
    }
    return (
      <TouchableOpacity
        style={[styles.wrapper, {
          marginBottom: imageMargin,
          marginRight: imageMargin,
          height: this._imageSize,
          width: this._imageSize
        }]}
        onPress={() => this._handleClick(item)}>
        <View style={styles.imageWrapper}>
          <Image source={source} style={[styles.image]}></Image>
        </View>
        <Text style={[styles.text, {textAlign: 'center'}]}>{text}</Text>
      </TouchableOpacity>
    )
  }

  _handleClick (item) {
    this.props.onClick(item)
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    flex: 1
  },
  image: {
    tintColor: '#cccccc',
  },
  imageWrapper: {
    top: 10,
    justifyContent:'center',
    alignItems: 'center',
    flex: 1.5
  },
  text: {
    fontSize: 14,
    alignItems: 'center',
    color: '#cccccc',
    flex: 1
  }
})

PickerButtonItem.propTypes = {
  item: React.PropTypes.string,
  onClick: React.PropTypes.func
}

export default PickerButtonItem
