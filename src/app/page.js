'use client'

import { useState, useEffect, useRef } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Grid, Box, Stack, Typography, Button, Modal, TextField, CssBaseline, useMediaQuery, Snackbar, CircularProgress } from '@mui/material'
import { firestore, storage } from '@/firebase'
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Camera } from "react-camera-pro";
import { FaCamera } from "react-icons/fa";

const theme = createTheme({
  palette: {
    primary: {
      main: '#0D47A1',
    },
    secondary: {
      main: '#E3F2FD',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: 'clamp(2rem, 4vw, 3rem)',  // Responsive font size
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',  // Responsive font size
    },
    h3: {
      fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    },
    h5: {
      fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', // Responsive font size
    }
  },
  shape: {
    borderRadius: 12,
  },
})

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'white',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  borderRadius: '15px',
}

const addItemButtonStyle = {
  padding: '10px 20px',
  fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',  // Responsive font size
  backgroundColor: '#4CAF50',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  '&:hover': {
    backgroundColor: '#45A049',
  },
}

const quantityControlsStyle = {
  display: 'flex',
  alignItems: 'center'
}

const quantityButtonStyle = {
  height: '24px',
  fontSize: '1.2rem',
  color: '#FFFFFF',
  borderRadius: '20px',
  minWidth: 0,
}

const addQuantityStyle = {
  backgroundColor: '#4CAF50',
  '&:hover': {
    backgroundColor: '#45A049',
  },
}

const subtractQuantityStyle = {
  backgroundColor: '#f44336',
  '&:hover': {
    backgroundColor: '#d32f2f',
  },
}

const cameraButtonStyle = {
  backgroundColor: '#0D47A1',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  '&:hover': {
    backgroundColor: '#0A3D91',
  },
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const cameraRef = useRef(null)

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarImage, setSnackbarImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState("");

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isShortScreen = useMediaQuery('(max-height: 720px)')

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }
  
  useEffect(() => {
    updateInventory()
  }, [])

  const addItem = async (itemName, newImageUrl) => {
    const docRef = doc(collection(firestore, 'inventory'), itemName);
    const docSnap = await getDoc(docRef);
  
    if (docSnap.exists()) {
      const { quantity, imageUrl: oldImageUrl } = docSnap.data();
  
      if (oldImageUrl && oldImageUrl !== newImageUrl) {
        const storageRef = ref(storage, oldImageUrl);
        try {
          await deleteObject(storageRef);
          console.log("Old image deleted successfully");
        } catch (error) {
          console.error("Error deleting old image:", error);
        }
      }
  
      await setDoc(docRef, { quantity: quantity + 1, imageUrl: newImageUrl }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: 1, imageUrl: newImageUrl });
    }
  
    await updateInventory();
  };  
  
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity, imageUrl } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
        if (imageUrl) {
          const storageRef = ref(storage, imageUrl);
          await deleteObject(storageRef);
        }
      } else {
        await setDoc(docRef, { quantity: quantity - 1, imageUrl: quantity - 1 > 0 ? imageUrl : '' }, { merge: true })
      }
    }
    await updateInventory()
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setItemName("")
    setImageUrl("")
  }

  const handleModalClose = async () => {
    if (imageUrl) {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    }
    setOpen(false);
    setItemName("");
    setImageUrl("");
  };

  const handleCameraOpen = () => setCameraOpen(true)
  const handleCameraClose = () => setCameraOpen(false)
  
  const handleTakePhoto = async () => {
    const photo = cameraRef.current.takePhoto();

    // Convert the photo (data URL) to a Blob in JPEG format
    const response = await fetch(photo);
    const blob = await response.blob();
    const jpegBlob = new Blob([blob], { type: 'image/jpeg' });

    const imageName = new Date().toISOString() + '.jpeg';
    const storageRef = ref(storage, `images/${imageName}`);
    const uploadTask = uploadBytesResumable(storageRef, jpegBlob);

    setUploading(true);

    uploadTask.on(
        "state_changed",
        (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(progress);
        },
        (error) => {
            console.error("Upload error:", error);
            setUploading(false);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                setImageUrl(downloadURL);
                setUploading(false);
            });
        }
    );

    setSnackbarImage(photo);
    setSnackbarOpen(true);
    setTimeout(() => {
        setSnackbarOpen(false);
        setSnackbarImage(null);
    }, 3000);
    handleCameraClose();
  };
  
  const handleAddItem = async () => {
    if (!itemName) {
      console.error("Item name is missing");
      return;
    }
    await addItem(itemName, imageUrl);
    handleClose();
  };

  // Filter inventory based on search query
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        display={'flex'}
        justifyContent={isShortScreen ? 'flex-start' : 'center'}
        flexDirection={'column'}
        alignItems={'center'}
        bgcolor={'#FFFFFF'}
        gap={2}
        sx={{ overflow: 'auto' }}
      >
        <Box 
          className={isShortScreen ? 'short-screen-card' : ''}
          sx={{ 
            width: { xs: '100%', sm: '85%', md: '65%' }, 
            p: { xs: 2, sm: 3, md: 4 }, 
            bgcolor: isMobile ? 'transparent' : '#F0F0F0', 
            boxShadow: isMobile ? 'none' : 6, 
            borderRadius: isMobile ? 0 : 3, 
            border: isMobile ? 'none' : '1px solid #ddd',
          }}
        >
          <Typography variant="h1" color="black" mb={4} fontWeight="bold">
            Pantry Tracker 🥕
          </Typography>
          <Modal
            open={open}
            onClose={handleModalClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box 
              sx={{ 
                ...modalStyle, 
                width: '80%',
                maxWidth: '400px',
                maxHeight: '90vh', 
                overflowY: 'auto',
              }}
            >
              <Typography id="modal-modal-title" variant="h5" fontWeight="bold" component="h2" color="black" mb={2}>
                Add Item
              </Typography>
              <Stack width="100%" direction={'column'} spacing={3}>
                <TextField
                  id="outlined-basic"
                  label="Item Name"
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={handleCameraOpen}
                  sx={{ ...cameraButtonStyle, padding: '12px 20px', fontSize: '1.5rem' }}
                >
                  <FaCamera />
                </Button>
                {uploading && (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={24} />
                    <Typography variant="body1">{`Uploading: ${progress}%`}</Typography>
                  </Box>
                )}
                {imageUrl && (
                  <Typography variant="body1" color="primary">
                    Image uploaded successfully!
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddItem}
                  disabled={!itemName}
                  sx={addItemButtonStyle}
                >
                  Add Item
                </Button>
              </Stack>
            </Box>
          </Modal>

          <Modal
            open={cameraOpen}
            onClose={handleCameraClose}
            aria-labelledby="camera-modal-title"
            aria-describedby="camera-modal-description"
          >
            <Box 
              sx={{ 
                ...modalStyle, 
                width: { xs: '80%', md: '60%' },
                height: 'auto',
                maxHeight: '90vh', 
                overflowY: 'auto'
              }}
            >
              <Typography id="camera-modal-title" variant="h5" fontWeight="bold" component="h2" color="black" mb={2}>
                Take a Picture
              </Typography>
              <Box mt={3} display="flex" flexDirection="column" alignItems="center" gap={3} style={{ margin: 'auto', width: '70%'}}>
                <Camera ref={cameraRef} aspectRatio={1} style={{ width: '100%', maxWidth: '600px', height: 'auto' }} />
                <Button
                  variant="contained"
                  onClick={handleTakePhoto}
                  sx={{ ...cameraButtonStyle, padding: '10px 20px', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}
                >
                  Take Photo
                </Button>
              </Box>
            </Box>
          </Modal>

          {snackbarOpen && (
            <Box
              position="fixed"
              bottom="20px"
              left="20px"
              bgcolor="white"
              boxShadow={3}
              borderRadius="10px"
              p={0.5}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <img src={snackbarImage} alt="Taken" style={{ width: '200px', height: 'auto', borderRadius: '5px' }} />
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <TextField
              label="Search"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ bgcolor: 'white', fontSize: '1.2rem', width: '40%' }}
            />
            <Box display="flex" gap={1}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleOpen} 
                sx={addItemButtonStyle}
              >
                Add New Item
              </Button>
            </Box>
          </Box>

          <Box 
            bgcolor="white" 
            width="100%" 
            borderRadius="15px"
            sx={{ 
              p: { sm: 2 },
              borderRadius: 2, 
              border: { sm: 0, md: '1px solid #ddd' }
            }}
          >
            <Box
              width="100%"
              height="100px"
              bgcolor={'#0D47A1'}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              borderRadius="15px"
            >
              <Typography variant="h3" fontWeight={500} color="white" textAlign="center">
                Inventory Items
              </Typography>
            </Box>
            <Grid container spacing={2} bgcolor="white" padding={2} style={{ height: '350px', overflow: 'auto' }}>
              {filteredInventory.map(({ name, quantity, imageUrl }) => (
                <Grid item xs={12} md={6} lg={4} key={name}>
                  <Box
                    minHeight="140px"
                    display={'flex'}
                    flexDirection={'column'}
                    justifyContent={'space-between'}
                    alignItems={'center'}
                    bgcolor={'#E3F2FD'}
                    paddingX={{ xs: 2, md: 5 }}
                    paddingY={3}
                    borderRadius="15px"
                  >
                    {quantity > 0 && imageUrl && (
                      <img src={imageUrl} alt={name} style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'contain', borderRadius: '10px' }} />
                    )}
                    <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center" marginY={2}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                    <Box sx={quantityControlsStyle}>
                      <Typography variant="h6" color="primary" textAlign="center" marginRight={1}>
                        Quantity:
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => removeItem(name)}
                        sx={{ ...subtractQuantityStyle, ...quantityButtonStyle }}
                      >
                        -
                      </Button>
                      <Typography variant="h6" color="primary" textAlign="center" marginX={1}>
                        {quantity}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => addItem(name, imageUrl)}
                        sx={{ ...addQuantityStyle, ...quantityButtonStyle }}
                      >
                        +
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}