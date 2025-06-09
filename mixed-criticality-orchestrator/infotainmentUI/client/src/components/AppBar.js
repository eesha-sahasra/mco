import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import WifiTwoToneIcon from '@mui/icons-material/WifiTwoTone';
import BluetoothTwoToneIcon from '@mui/icons-material/BluetoothTwoTone';

export default function ButtonAppBar() {
    const [currentTime, setCurrentTime] = React.useState(new Date());
    const [language, setLanguage] = React.useState('en');
    // const [liveText,setLiveText]=React.useState('');

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    React.useEffect(()=>{
        const languageToggle=setInterval(()=>{
            setLanguage((prev)=>(prev==='en'?'jp':'en'));
        },1500);

        return ()=>clearInterval(languageToggle);
    },[]);

    // React.useEffect(()=>{
    //     const text="Welcomeuser";
    //     let index=0;

    //     const typingEffect=()=>{
    //         if(index<text.length){
    //             setLiveText((prev)=>prev+text[index]);
    //             index++;
    //             setTimeout(typingEffect,150);
    //         }
    //     };

    //     typingEffect();
    // },[]);

    return (
        <Box sx={{ flexGrow: 1 }} color="black">
            <AppBar position="static" sx={{ backgroundColor: '#1f2124' }}>
                <Toolbar>
                    {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {currentTime.toLocaleString()}
                    </Typography>
                    <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                        <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
                        {language === 'en' ? 'Welcome, user!' : 'ようこそ、ユーザー!'}
                        </Typography>
                    </Box>
                    <BluetoothTwoToneIcon sx={{color:'white'}} />
                    <WifiTwoToneIcon sx={{ color: 'white', mx:5 }} />
                    <Button color="inherit">DENSO</Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
