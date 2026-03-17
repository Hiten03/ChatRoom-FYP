import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddRoomModal from '../../components/AddRoomModal/AddRoomModal'
import RoomCard from '../../components/RoomCard/RoomCard';
import styles from './Rooms.module.css';
import { getAllRooms } from '../../http';
import { socketInit } from '../../socket';
import { ACTIONS } from '../../actions';

// const rooms = [
//     {
//         id: 1,
//         topic: 'Which framework best for frontend ?',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'John Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'Jane Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 40,
//     },
//     {
//         id: 3,
//         topic: 'What’s new in machine learning?',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'John Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'Jane Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 40,
//     },
//     {
//         id: 4,
//         topic: 'Why people use stack overflow?',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'John Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'Jane Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 40,
//     },
//     {
//         id: 5,
//         topic: 'Artificial inteligence is the future?',
//         speakers: [
//             {
//                 id: 1,
//                 name: 'John Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//             {
//                 id: 2,
//                 name: 'Jane Doe',
//                 avatar: '/images/monkey-avatar.png',
//             },
//         ],
//         totalPeople: 40,
//     },
// ];



const Rooms = () => {

    const [showModal, setShowModal] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        const fetchRooms = async () => {
            const {data} = await getAllRooms();
            setRooms(data);
        };
        fetchRooms();
    }, [])

    useEffect(() => {
        const socket = socketInit();

        const handleRoomCreated = (newRoom) => {
            setRooms((prevRooms) => {
                // Prevent duplicate additions in case the creator gets the event too
                if (prevRooms.some(r => r.id === newRoom.id)) return prevRooms;
                return [newRoom, ...prevRooms];
            });
        };

        socket.on(ACTIONS.ROOM_CREATED, handleRoomCreated);

        return () => {
            socket.off(ACTIONS.ROOM_CREATED, handleRoomCreated);
        };
    }, []);

    function openModal() {
        setShowModal(true);
    }

    const handleDeleteRoom = (roomId) => {
        setRooms((prev) => prev.filter((room) => room.id !== roomId));
    };

    const filteredRooms = rooms.filter((room) =>
        room.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return <>
        <div className='container'>
            <div className={styles.roomsHeader}>
                <div className={styles.left}>
                    <span className={styles.heading}>All voice rooms</span>
                </div>
                <div className={styles.right}>
                    <button onClick={openModal} className={styles.startRoomButton}>
                        <img src="/images/add-room-icon.png" alt="add-room" />
                        <span>Start a room</span>
                    </button>
                </div>
            </div>

            <div className={styles.roomList}>
                {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => (
                        <RoomCard key={room.id} room={room} onDelete={handleDeleteRoom} />
                    ))
                ) : (
                    <div className={styles.noResults}>
                        <p>No rooms found{searchQuery && ` for "${searchQuery}"`}</p>
                    </div>
                )}
            </div>
        </div>
        {showModal && <AddRoomModal onClose={() => setShowModal(false)} />}
    </>;
};

export default Rooms;