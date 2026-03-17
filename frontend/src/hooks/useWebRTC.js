// // import { Provider } from "react-redux";
// // import { useStateWithCallback } from "./useStateWithCallback";
// // import { useCallback, useEffect, useRef } from "react";


// // export const useWebRTC = (roomId, user) => {
// //     const [clients, setClients] = useStateWithCallback([]);
// //     const audioElements = useRef({});
// //     const connections = useRef({});
// //     const localMediaStream = useRef(null);


// //     const addNewClients = useCallback(
// //         (newClient, cb) => {
// //             const lookingFor = clients.find((client) => client.id === newClient.id);

// //             if (lookingFor === undefined){
// //                 setClients((existingClients) => [...existingClients, newClient], cb);
// //             }

// //         },
// //         [clients, setClients],
// //     )

// //     //capture media from computer

// //     useEffect(() => {
// //         const startCapture = async() => {
// //             localMediaStream.current = await navigator.mediaDevices.getUserMedia({
// //                 audio: true
// //             });
// //         };

// //         startCapture().then(() => {
// //             addNewClients(user, () => {
// //                 const localElement = audioElements.current[user.id];
// //                 if(localElement){
// //                     // localElement.volume = 0;
// //                     localElement.srcObject = localMediaStream.current;
// //                 }
// //             })
// //         })
// //     }, []);


// //     const provideRef = (instance, userId) => {
// //         audioElements.current[userId] = instance;
// //     };

// //     return { clients, provideRef };
// // }


// import { useStateWithCallback } from "./useStateWithCallback";
// import { useCallback, useEffect, useRef } from "react";
// import { socketInit } from '../socket';
// import { ACTIONS } from "../actions";
// // import { connection } from "mongoose";
// import freeice from 'freeice';
// // import { off } from "process";

// export const useWebRTC = (roomId, user) => {

//     const [clients, setClients] = useStateWithCallback([]);
//     const audioElements = useRef({});
//     const connections = useRef({});
//     const localMediaStream = useRef(null);
//     const socket = useRef(null);
//     useEffect(() => {
//         socket.current = socketInit();
//     },[])

//     const captureStarted = useRef(false);

//     const addNewClient = useCallback(
//         (newClient, cb) => {

//             const lookingFor = clients.find(
//                 (client) => client.id === newClient.id
//             );

//             if (lookingFor === undefined) {
//                 setClients((existingClients) => [...existingClients, newClient], cb);
//             }

//         },
//         [clients, setClients]
//     );

//     // Capture microphone

//     useEffect(() => {
//         if (captureStarted.current) return;
//         captureStarted.current = true;

//         const startCapture = async () => {
//             localMediaStream.current =
//                 await navigator.mediaDevices.getUserMedia({
//                     audio: true
//                 });
//         };

//         startCapture().then(() => {
//             addNewClient(user, () => {
//                 const localElement = audioElements.current[user.id];
//                 if (localElement) {
//                     // Mute self audio
//                     localElement.volume = 0;
//                     localElement.srcObject = localMediaStream.current;
//                 }

//                 //SOCKET EMIT JOIN socket io
//                 socket.current.emit(ACTIONS.JOIN, {roomId, user});
//             });
//         });

//         return () => {
//             //leaving the room
//             localMediaStream.current.getTracks().forEach(track => {
//                 track.stop()
//             });

//             socket.current.emit(ACTIONS.LEAVE, {roomId});
//         };
//     }, []);

//     useEffect(() => {
//         const handleNewPeer = async ({peerId, createOffer, user: remoteUser}) => {
//             //if already connected then give warning 
//             if(peerId in connections.current){
//                 return console.warn('You are already connected with ${peerId} (${user.name})');
//             }

//             connections.current[peerId] = new RTCPeerConnection({
//                 iceServers: freeice()
//             });

//             //handle new ice candidate
//             connections.current[peerId].onicecandidate = (event) => {
//                 socket.current.emit(ACTIONS.RELAY_ICE, {
//                     peerId,
//                     icecandidate: event.candidate
//                 })
//             }

//             //handle on track on this connection
//             connections.current[peerId].ontrack = ({
//                 streams: [remoteStream]
//             }) => {
//                 addNewClient(remoteUser, () => {
//                     if(audioElements.current[remoteUser.id]){
//                         audioElements.current[remoteUser.id].srcObject = remoteStream
//                     } else{
//                         let settled = false;
//                         const interval = setInterval(() => {
//                             if(audioElements.current[remoteUser.id]){
//                                 audioElements.current[remoteUser.id].srcObject = remoteStream
//                                 settled = true;
//                             }
//                             if(settled){
//                                 clearInterval(interval);
//                             }
//                         }, 1000)
//                     }
//                 })
//             };

//             //add local track to remote connections
//             localMediaStream.current.getTracks().forEach(track => {
//                 connections.current[peerId].addTrack(track, localMediaStream.current);
//             });

//             //create offer
//             if(createOffer){
//                 const offer = await connections.current[peerId].createOffer();

//                 await connections.current[peerId].setLocalDescription(offer);
//                 //send offer to another client
//                 socket.current.emit(ACTIONS.RELAY_SDP, {
//                     peerId,
//                     sessionDescription: offer
//                 })
//             }
//         };
//         socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);

//         return () => {
//             socket.current.off(ACTIONS.ADD_PEER);
//         }
//     }, []);

//     //handle ice candidate
//     useEffect(() => {
//         socket.current.on(ACTIONS.ICE_CANDIDATE, ({peerId, icecandidate}) => {
//             if(icecandidate){
//                 connections.current[peerId].addIceCandidate(icecandidate);
//             }
//         })

//         return () => {
//             socket.current.off(ACTIONS.ICE_CANDIDATE);
//         }
//     }, []);


//     //handle sdp
//     useEffect(() => {

//         const handleRemoteSdp = async ({peerId, sessionDescription: remoteSessionDescription,}) => {
//             connections.current[peerId].setRemoteDescription(
//                 new RTCSessionDescription(remoteSessionDescription)
//             )

//             //if session description is type of offer then create an answer

//             if(remoteSessionDescription.type === 'offer'){
//                 const connection = connections.current[peerId];
//                 const answer = await connection.createAnswer();

//                 connection.setLocalDescription(answer);


//                 socket.current.emit(ACTIONS.RELAY_SDP, {
//                     peerId,
//                     sessionDescription: answer,
//                 })
//             }

//         };
//         socket.current.on(ACTIONS.SESSION_DESCRIPTION, handleRemoteSdp);

//         return () => {
//             socket.current.off(ACTIONS.SESSION_DESCRIPTION);
//         }
//     }, []);

//     //handle remove peer
//     useEffect(()=> {
//         const handleRemovePeer = async ({peerId, userId}) => {
//             if(connections.current[peerId]){
//                 connections.current[peerId].close();
//             }

//             delete connections.current[peerId];
//             delete audioElements.current[peerId];
//             setClients(list => list.filter(client => client.id !== userId));
//         };
//         socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

//         return () => {
//             socket.current.off(ACTIONS.REMOVE_PEER);
//         };
//     }, [])


//     const provideRef = (instance, userId) => {
//         audioElements.current[userId] = instance;
//     };

//     return { clients, provideRef };
// };


import { useStateWithCallback } from "./useStateWithCallback";
import { useCallback, useEffect, useRef, useState } from "react";
import { socketInit } from "../socket";
import { ACTIONS } from "../actions";
import freeice from "freeice";

export const useWebRTC = (roomId, user) => {

    const [clients, setClients] = useStateWithCallback([]);
    const audioElements = useRef({});
    const connections = useRef({});
    const localMediaStream = useRef(null);
    const socket = useRef(null);
    const clientsRef = useRef([]);
    const [roles, setRoles] = useState({});
    const [ownerId, setOwnerId] = useState(null);
    const [isModerator, setIsModerator] = useState(false);
    const rolesRef = useRef({});
    
    // Auth Errors
    // eslint-disable-next-line no-unused-vars
    const [accessError, setAccessError] = useState(null);

    const captureStarted = useRef(false);

    useEffect(() => {
        socket.current = socketInit();
    }, []);

    const addNewClient = useCallback(
        (newClient, cb) => {
            const lookingFor = clientsRef.current.find(
                (client) => client.id === newClient.id
            );

            if (lookingFor === undefined) {
                setClients((existingClients) => [...existingClients, newClient], cb);
            }
        },
        [setClients]
    );

    const addNewClientRef = useRef(addNewClient);
    useEffect(() => {
        addNewClientRef.current = addNewClient;
    }, [addNewClient]);

    // Error Handling listener
    useEffect(() => {
        socket.current.on('join-error', ({ message }) => {
            setAccessError(message);
        });

        socket.current.on(ACTIONS.JOINED_ROOM, ({ role, isModerator, ownerId, roles }) => {
            setRoles(roles);
            rolesRef.current = roles;
            setIsModerator(isModerator);
            setOwnerId(ownerId);
        });

        socket.current.on('mutual-follow-broken', ({ userA, userB }) => {
            // Check if one of these users is the room owner
            if (userA === ownerId || userB === ownerId) {
                setAccessError("Your mutual follow status with the room host was broken. You no longer have access.");
            }
        });

        return () => {
            socket.current.off('join-error');
            socket.current.off(ACTIONS.JOINED_ROOM);
            socket.current.off('mutual-follow-broken');
        }
    }, [ownerId]);

    // Capture microphone
    useEffect(() => {

        if (captureStarted.current) return;
        captureStarted.current = true;

        const startCapture = async () => {
            try {
                localMediaStream.current =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });

                addNewClientRef.current({ ...user, muted: true }, () => {
                    const localElement = audioElements.current[user.id];

                    if (localElement) {
                        localElement.volume = 0;
                        localElement.srcObject = localMediaStream.current;
                    }
                });

                socket.current.emit(ACTIONS.JOIN, { roomId, user });

            } catch (error) {
                console.error("Microphone access error:", error);
            }
        };

        startCapture();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cleanup: stop tracks and leave room on unmount
    useEffect(() => {
        return () => {
            if (localMediaStream.current) {
                localMediaStream.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            if (socket.current) {
                socket.current.emit(ACTIONS.LEAVE, { roomId });
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);



    // Handle new peer
    useEffect(() => {

        const handleNewPeer = async ({ peerId, createOffer, user: remoteUser }) => {

            if (peerId in connections.current) {
                console.warn(`Already connected with ${peerId} (${remoteUser.name})`);
                return;
            }

            connections.current[peerId] = new RTCPeerConnection({
                iceServers: freeice(),
            });

            // ICE candidate
            connections.current[peerId].onicecandidate = (event) => {
                socket.current.emit(ACTIONS.RELAY_ICE, {
                    peerId,
                    icecandidate: event.candidate,
                });
            };

            // Remote stream
            connections.current[peerId].ontrack = ({ streams: [remoteStream] }) => {

                addNewClientRef.current({ ...remoteUser, muted: true }, () => {

                    if (audioElements.current[remoteUser.id]) {
                        audioElements.current[remoteUser.id].srcObject = remoteStream;
                    } else {

                        let settled = false;

                        const interval = setInterval(() => {

                            if (audioElements.current[remoteUser.id]) {
                                audioElements.current[remoteUser.id].srcObject = remoteStream;
                                settled = true;
                            }

                            if (settled) clearInterval(interval);

                        }, 500);

                    }

                });

            };

            // Add local tracks
            if (localMediaStream.current) {
                localMediaStream.current.getTracks().forEach((track) => {
                    connections.current[peerId].addTrack(
                        track,
                        localMediaStream.current
                    );
                });
            }

            // Create offer
            if (createOffer) {

                const offer = await connections.current[peerId].createOffer();

                await connections.current[peerId].setLocalDescription(offer);

                socket.current.emit(ACTIONS.RELAY_SDP, {
                    peerId,
                    sessionDescription: offer,
                });

            }

        };

        socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);

        return () => {
            socket.current.off(ACTIONS.ADD_PEER);
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    // Handle ICE candidate
    useEffect(() => {

        const handleIceCandidate = ({ peerId, icecandidate }) => {

            if (icecandidate && connections.current[peerId]) {
                connections.current[peerId].addIceCandidate(icecandidate);
            }

        };

        socket.current.on(ACTIONS.ICE_CANDIDATE, handleIceCandidate);

        return () => {
            socket.current.off(ACTIONS.ICE_CANDIDATE);
        };

    }, []);



    // Handle SDP
    useEffect(() => {

        const handleRemoteSdp = async ({ peerId, sessionDescription }) => {

            if (!connections.current[peerId]) return;

            await connections.current[peerId].setRemoteDescription(
                new RTCSessionDescription(sessionDescription)
            );

            if (sessionDescription.type === "offer") {

                const answer = await connections.current[peerId].createAnswer();

                await connections.current[peerId].setLocalDescription(answer);

                socket.current.emit(ACTIONS.RELAY_SDP, {
                    peerId,
                    sessionDescription: answer,
                });

            }

        };

        socket.current.on(ACTIONS.SESSION_DESCRIPTION, handleRemoteSdp);

        return () => {
            socket.current.off(ACTIONS.SESSION_DESCRIPTION);
        };

    }, []);



    // Remove peer
    useEffect(() => {

        const handleRemovePeer = ({ peerId, userId }) => {

            if (connections.current[peerId]) {
                connections.current[peerId].close();
            }

            delete connections.current[peerId];
            delete audioElements.current[userId];

            setClients((list) => list.filter((client) => client.id !== userId));

        };

        socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

        return () => {
            socket.current.off(ACTIONS.REMOVE_PEER);
        };

    }, [setClients]);

    useEffect(() => {
        clientsRef.current = clients;
    }, [clients]);

    //Listen for mute/unmute
    useEffect(() => {
        socket.current.on(ACTIONS.MUTE, ({ peerId, userId }) => {
            setMuteState(true, userId);
        })

        socket.current.on(ACTIONS.UN_MUTE, ({ peerId, userId }) => {
            setMuteState(false, userId);
        })

        const setMuteState = (mute, userId) => {
            setClients((prevClients) => {
                return prevClients.map(client => {
                    if (client.id === userId) {
                        return { ...client, muted: mute };
                    }
                    return client;
                });
            });
        }
    }, [setClients]);

    // Listen for role changes
    useEffect(() => {
        socket.current.on(ACTIONS.ROLE_CHANGED, async ({ roles: newRoles, ownerId: newOwnerId }) => {
            const prevRole = rolesRef.current[user.id] || rolesRef.current[user._id];
            const newRole = newRoles[user.id] || newRoles[user._id];

            setRoles(newRoles);
            rolesRef.current = newRoles;
            if (newOwnerId) setOwnerId(newOwnerId);

            // When promoted from listener to speaker, the WebRTC audio pipeline needs 
            // to be fully rebuilt because some browsers don't resume hardware tracks 
            // over existing connections correctly after being muted for a long time.
            // Since the server preserves the promoted role, an automatic reload
            // correctly re-establishes all peer connections identically to a fresh join.
            if (prevRole === 'listener' && newRole === 'speaker') {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        });

        return () => {
            socket.current.off(ACTIONS.ROLE_CHANGED);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    const provideRef = (instance, userId) => {
        audioElements.current[userId] = instance;
    };

    //Handling mute
    const handleMute = (isMute, userId) => {
        let settled = false;
        let interval = setInterval(() => {
            if (localMediaStream.current) {
                localMediaStream.current.getTracks()[0].enabled = !isMute;

                if (isMute) {
                    socket.current.emit(ACTIONS.MUTE, { roomId, userId });
                } else {
                    socket.current.emit(ACTIONS.UN_MUTE, { roomId, userId });
                }

                settled = true;
            }

            if (settled) {
                clearInterval(interval);
            }
        }, 200);

    };

    // Set role (owner only)
    const setRole = (targetUserId, role) => {
        socket.current.emit(ACTIONS.SET_ROLE, {
            roomId,
            targetUserId,
            role,
        });
    };

    // Reactions state
    const [reactions, setReactions] = useState([]);

    // Room Chat & Hand Raise State
    const [messages, setMessages] = useState([]);
    const [raisedHands, setRaisedHands] = useState([]);

    useEffect(() => {
        socket.current.on(ACTIONS.REACTION, ({ emoji, userName }) => {
            const id = Date.now() + Math.random();
            setReactions((prev) => [...prev, { id, emoji, userName }]);
            setTimeout(() => {
                setReactions((prev) => prev.filter(r => r.id !== id));
            }, 2000);
        });

        return () => {
            socket.current.off(ACTIONS.REACTION);
        };
    }, []);

    const sendReaction = (emoji) => {
        socket.current.emit(ACTIONS.REACTION, { roomId, emoji, userName: user.name });
        
        // Show locally as well
        const id = Date.now() + Math.random();
        setReactions((prev) => [...prev, { id, emoji, userName: user.name }]);
        setTimeout(() => {
            setReactions((prev) => prev.filter(r => r.id !== id));
        }, 2000);
    };

    // --- Chat Logic ---
    useEffect(() => {
        // Initial history load
        socket.current.on(ACTIONS.CHAT_HISTORY, ({ messages }) => {
            setMessages(messages || []);
        });

        // Incoming message
        socket.current.on(ACTIONS.ROOM_MESSAGE, (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            socket.current.off(ACTIONS.CHAT_HISTORY);
            socket.current.off(ACTIONS.ROOM_MESSAGE);
        };
    }, []);

    const sendMessage = (text) => {
        const message = {
            id: Date.now() + Math.random(),
            user,
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        // Emit to server
        socket.current.emit(ACTIONS.ROOM_MESSAGE, { roomId, message });
        // Add to local state
        setMessages((prev) => [...prev, message]);
    };

    // --- Hand Raise Logic ---
    useEffect(() => {
        socket.current.on(ACTIONS.RAISE_HAND, ({ raisedHands: h, justRaisedBy }) => {
            setRaisedHands(h || []);
            // Notification logic will be handled inside the Room component to check for speaker/owner role
        });

        return () => {
            socket.current.off(ACTIONS.RAISE_HAND);
        };
    }, []);

    const toggleHandRaise = (isRaised) => {
        if (isRaised) {
            socket.current.emit(ACTIONS.RAISE_HAND, { roomId, userId: user.id || user._id });
        } else {
            socket.current.emit(ACTIONS.LOWER_HAND, { roomId, userId: user.id || user._id });
        }
    };

    return { 
        clients, 
        provideRef, 
        handleMute, 
        roles, 
        isModerator,
        ownerId, 
        setRole, 
        reactions, 
        sendReaction,
        messages,
        sendMessage,
        raisedHands,
        toggleHandRaise
    };
};